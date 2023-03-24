import * as fs from 'fs'
import * as ts from 'typescript'
import {
  factory,
  formatting,
  getTokenAtPosition,
  isJsxAttribute,
  isStringLiteral,
  isJsxElement,
  isJsxOpeningLikeElement,
  isJsxSpreadAttribute,
  JsxOpeningLikeElement,
  Node,
  resolveModuleName,
  setParent,
  Symbol,
  SymbolFlags,
  textChanges,
} from 'typescript'
import { ExistingAttribute, PanelsResponse } from '../Shared/PanelTypes'
import { isDefined } from 'ts-is-defined'
import { MatcherContext, PANELS } from './ts/Panels'
import { FileTextChanges, SetAttributesAtPositionRequest } from '../common/api'
import prettier from 'prettier'
import { createLogger } from './logger'
import { isString } from 'lodash-es'
import { AppEmitter } from './AppEmitter'
import assert from 'assert'
import { startIoSession } from './session'
import { Session } from './ts/session'
import path from 'path'
import { Project } from './ts/project'
import { asNormalizedPath } from './ts/utilitiesPublic'
import { existingAttributeSchema, panelsResponseSchema } from '../Shared/PanelTypesZod'

export const logger = createLogger('ts')

export const getTsMethods = (ioSession: Session, project: Project) => {
  function getTokenAtFilename(fileName: string, position: number) {
    const program = project.getLanguageService().getProgram()
    const sourceFile = program?.getSourceFile(fileName)
    if (!sourceFile) {
      console.error('Missing source file', fileName)
      return
    }
    return getTokenAtPosition(sourceFile, position)
  }

  function getParentTokenAtPosition(fileName: string, position: number): JsxOpeningLikeElement | undefined {
    const token = getTokenAtFilename(fileName, position)

    const parent = token?.parent
    if (parent && isJsxOpeningLikeElement(parent)) {
      return parent
    }
  }

  async function getPanelsAtLocation(
    fileName: string,
    line: number,
    col: number
  ): Promise<panelsResponseSchema> {
    const sourceFile = requireSourceFile(fileName)
    return getPanelsAtPosition(sourceFile.fileName, sourceFile.getPositionOfLineAndCharacter(line, col))
  }

  async function getPanelsAtPosition(fileName: string, position: number): Promise<panelsResponseSchema> {
    const parent = getParentTokenAtPosition(fileName, position)
    if (parent) {
      const languageService = project.getLanguageService()
      const program = languageService.getProgram()
      const typeChecker = program!.getTypeChecker()
      const typeAtLocation = typeChecker!.getContextualType(parent.attributes)
      const jsxTag = parent.parent

      const sxPropsType = getExport('@mui/system', 'SystemCssProperties')
      const matcherContext: MatcherContext = {
        c: typeChecker!,
        types: { SxProps: sxPropsType },
      }
      const existingAttributes: existingAttributeSchema[] = parent.attributes.properties
        // .filter((v) => v.name?.getText() === 'sx')
        .map((attr) => {
          if (isJsxAttribute(attr)) {
            console.log(attr.initializer)
            const initializer = attr.initializer
            const type = initializer && typeChecker.getTypeAtLocation(attr)
            const value = initializer?.getText()
            const name = attr.name.escapedText.toString()
            return {
              name: name,
              value: value === undefined ? true : value,
              hasInitializer: !!initializer,
              location: {
                pos: attr.pos,
                end: attr.end,
              },
              panels: !type
                ? ([] as string[])
                : name === 'children'
                ? ['children']
                : type
                ? PANELS.map((v) => v.reverseMatch?.(attr, matcherContext)).filter(isDefined)
                : ([] as string[]),
            }
          }
        })
        .filter(isDefined)
      const existingIncludingChildren = existingAttributes.filter(isDefined)
      if (isJsxElement(jsxTag)) {
        const childrenStart = jsxTag.openingElement.end
        const childrenEnd = jsxTag.closingElement.pos

        existingIncludingChildren.push({
          name: 'children',
          location: {
            pos: childrenStart,
            end: childrenEnd,
          },
          value: parent.getSourceFile().getText().slice(childrenStart, childrenEnd).trim(),
        })
      }

      if (typeAtLocation) {
        const attributes = [...typeAtLocation.getProperties()]
          // .filter((v) => v.name === 'variant')
          // .filter((v) => v.name === 'sx')
          .map((prop) => {
            const type = typeChecker!.getNonNullableType(typeChecker!.getTypeOfSymbol(prop))

            return {
              name: prop.name,
              location: existingIncludingChildren.find((v) => v.name === prop.name)?.location,
              panels:
                prop.name === 'children'
                  ? [{ name: 'Children' } as const]
                  : type
                  ? PANELS.map((v) => v.matcher(type, matcherContext)).filter(isDefined)
                  : [],
            }
          })

        return {
          attributes: [...attributes],
          existingAttributes: existingIncludingChildren,
          location: parent.pos,
          fileName,
          range: getRange(parent),
        }
      }
    }
    return { attributes: [], existingAttributes: [] }
  }

  function getSourceFile(fileName: string) {
    return project.getLanguageService().getProgram()!.getSourceFile(fileName)
  }

  function requireSourceFile(fileName: string) {
    const sourceFile = getSourceFile(fileName)
    if (!sourceFile) throw new Error('Source file not found ' + fileName)
    return sourceFile
  }

  function getExport(moduleName: string, name: string) {
    const rootFileName = project.getLanguageService().getProgram()!.getRootFileNames()[0]
    const resolved = resolveModuleName(
      moduleName,
      rootFileName,
      project.getLanguageService().getProgram()!.getCompilerOptions(),
      project
    )
    if (!resolved.resolvedModule) throw new Error('Not found')
    const sourceFile = getSourceFile(resolved.resolvedModule.resolvedFileName)
    if (!sourceFile) return

    const symbolAtLocation = project
      .getLanguageService()
      .getProgram()!
      .getTypeChecker()!
      .getSymbolAtLocation(sourceFile)!
    const exportsOfModule = project
      .getLanguageService()
      .getProgram()!
      .getTypeChecker()!
      .getExportsOfModule(getAliasedSymbolIfNecessary(symbolAtLocation))
    const moduleExport = exportsOfModule.find((v) => v.name === name)!
    if (!moduleExport) throw new Error('Not found')

    const declaredTypeOfSymbol = project
      .getLanguageService()
      .getProgram()!
      .getTypeChecker()!
      .getDeclaredTypeOfSymbol(moduleExport)
    return declaredTypeOfSymbol
    return project
      .getLanguageService()
      .getProgram()!
      .getTypeChecker()!
      .getNonNullableType(declaredTypeOfSymbol)
  }

  function getAliasedSymbolIfNecessary(symbol: Symbol) {
    if ((symbol.flags & SymbolFlags.Alias) !== 0)
      return project.getLanguageService().getProgram()!.getTypeChecker()!.getAliasedSymbol(symbol)
    return symbol
  }

  const getRange = (node: Node) => {
    const sourceFile = node.getSourceFile()
    const { line: startLineNumber, character: startColumn } = sourceFile.getLineAndCharacterOfPosition(
      node.pos
    )
    const { line: endLineNumber, character: endColumn } = sourceFile.getLineAndCharacterOfPosition(node.end)
    return {
      startColumn: startColumn ? startColumn + 2 : startColumn,
      startLineNumber: startLineNumber + 1,
      endColumn: endColumn + 1,
      endLineNumber: endLineNumber + 1,
    }
  }

  function emitFile(fileName: string) {
    const output = project.getLanguageService().getEmitOutput(fileName)

    if (!output.emitSkipped) {
      console.log(`Emitting ${fileName}`)
    } else {
      console.log(`Emitting ${fileName} failed`)
      logErrors(fileName)
    }

    output.outputFiles.forEach((o) => {
      fs.writeFileSync(o.name, o.text, 'utf8')
    })
  }

  function logErrors(fileName: string) {
    const allDiagnostics = project
      .getLanguageService()
      .getCompilerOptionsDiagnostics()
      .concat(project.getLanguageService().getSyntacticDiagnostics(fileName))
      .concat(project.getLanguageService().getSemanticDiagnostics(fileName))

    allDiagnostics.forEach((diagnostic) => {
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
      if (diagnostic.file) {
        const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!)
        console.log(`  Error ${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`)
      } else {
        console.log(`  Error: ${message}`)
      }
    })
  }

  function setAttributeAtPosition(args: SetAttributesAtPositionRequest): FileTextChanges[] | false {
    console.log(32113312, args)
    logger.debug(`setAttributeAtPosition ${JSON.stringify(args, null, 2)}`)
    const { fileName, position, attrName, value } = args
    const sourceFile = requireSourceFile(fileName)
    const token = getTokenAtFilename(fileName, position)
    const name = factory.createIdentifier(attrName)

    const fileTextChanges = textChanges.ChangeTracker.with(
      {
        host: project,
        preferences: {},
        formatContext: formatting.getFormatContext({}, { getNewLine: () => '\n' }),
      },
      (t) => {
        const tokenWithAttr = token?.parent.parent.parent
        if (!tokenWithAttr) {
          console.error('tokenWithAttr not found')
          return
        }
        const jsxAttributesNode =
          tokenWithAttr && isJsxOpeningLikeElement(tokenWithAttr)
            ? tokenWithAttr.attributes
            : isJsxOpeningLikeElement(token?.parent)
            ? token?.parent.attributes
            : undefined
        if (!jsxAttributesNode) {
          console.error('Attributes not found')
          return
        }
        // const jsxNode = token.parent.parent.parent.parent
        const jsxNode = token.parent.parent
        const childrenNodes = isJsxElement(jsxNode) && jsxNode.children
        const existingToken = jsxAttributesNode?.properties.find((v) => v.name?.getText() === attrName)
        const text = value === true ? attrName : `${attrName}=${value}`
        if (attrName === 'children') {
          if (childrenNodes) {
            if (childrenNodes.length) {
              assert(value !== true)
              t.replaceRangeWithText(
                sourceFile,
                {
                  pos: jsxNode.openingElement.end,
                  end: jsxNode.closingElement.pos,
                },
                value || ''
              )
            } else {
              t.insertNodeAt(
                sourceFile,
                childrenNodes.pos,
                factory.createIdentifier(value?.toString() || ''),
                {}
              )
            }
          } else {
            console.error('Children are not a JSX Element')
            return
          }
        } else if (existingToken && !isJsxSpreadAttribute(existingToken)) {
          const options = { prefix: existingToken.pos === existingToken.end ? ' ' : undefined }
          if (value === true) {
            t.replaceNodeWithText(sourceFile, existingToken, text)
          } else if (value !== undefined) {
            t.replaceNodeWithText(sourceFile, existingToken, text)
          } else {
            t.deleteNode(sourceFile, existingToken)
          }
        } else {
          const name = factory.createIdentifier(attrName)
          const jsxAttribute = factory.createJsxAttribute(name, factory.createStringLiteral('placeholder'))
          const hasSpreadAttribute = jsxAttributesNode.properties.some(isJsxSpreadAttribute)
          setParent(name, jsxAttribute)
          const jsxAttributes = factory.createJsxAttributes(
            hasSpreadAttribute
              ? [jsxAttribute, ...jsxAttributesNode.properties]
              : [...jsxAttributesNode.properties, jsxAttribute]
          )
          const options = { prefix: jsxAttributesNode.pos === jsxAttributesNode.end ? ' ' : undefined }
          // t.replaceNode(sourceFile, jsxAttributesNode, jsxAttributes, options)
          t.insertText(sourceFile, jsxAttributesNode.end, ` ${text}`)
        }
      }
    ) as FileTextChanges[]
    const undoChanges = applyChanges(fileTextChanges)
    if (tryWriteFiles([fileName])) {
      return undoChanges
    } else {
      return false
    }
  }

  const doChanges = (changes: FileTextChanges[]) => {
    const undoChanges = applyChanges(changes)
    const files = undoChanges.map((v) => v.fileName)
    if (tryWriteFiles(files)) {
      return undoChanges
    }
    return false
  }
  const applyChanges = (changes: FileTextChanges[]): FileTextChanges[] => {
    logger.debug(`applyChanges ${JSON.stringify(changes, null, 2)}`)
    return changes.map((change) => {
      const scriptInfo = ioSession.projectService.getScriptInfo(change.fileName)!
      const snapshot = scriptInfo.getSnapshot()
      const undoChanges: FileTextChanges = {
        ...change,
        textChanges: Array.from(change.textChanges.values()).map(({ newText, span }) => ({
          span: { start: span.start, length: newText.length },
          newText: snapshot.getText(span.start, span.start + span.length),
        })),
      }
      console.dir({ undoChanges, changes }, { depth: Infinity })

      ioSession.projectService.applyChangesToFile(scriptInfo, change.textChanges.values())
      return undoChanges
    })
  }

  const runDiagnosticsAsync = (fileName: string) => {
    const diagnostics = project.getLanguageService().getSemanticDiagnostics(fileName)

    if (diagnostics.length) {
      logger.warn(diagnostics)
    }
    AppEmitter.emit(
      'diagnostics',
      fileName,
      diagnostics.map(({ messageText, source, start, file }) => ({
        type: 'TS',
        fileName: fileName,
        position: start,
        text: isString(messageText) ? messageText : messageText.messageText,
      }))
    )
  }

  const tryWriteFiles = (fileNames: string[]) => {
    try {
      const results = fileNames.map((fileName) => {
        const config = prettier.resolveConfig.sync(fileName)
        const scriptInfo = ioSession.projectService.getScriptInfo(fileName)!
        return prettier.format(scriptInfo.getSnapshot().getText(0, scriptInfo.getSnapshot().getLength()), {
          ...config,
          filepath: fileName,
        })
      })
      for (let i = 0; i < fileNames.length; i++) {
        const fileName = fileNames[i]
        ioSession.projectService.host.writeFile(fileName, results[i])
        // runDiagnosticsAsync(fileName) TODO
      }
      return true
    } catch (e) {
      if (e instanceof SyntaxError) {
        logger.warn('Prettier, not writing')
        logger.warn(e)
      }
      for (const fileName of fileNames) {
        const scriptInfo = ioSession.projectService.getScriptInfo(fileName)!
        scriptInfo.reloadFromFile()
      }
    }

    return false
  }

  return {
    doChanges,
    getPanelsAtLocation,
    getPanelsAtPosition,
    setAttributeAtPosition,
  }
}

export const startTs = () => {
  const ioSession = startIoSession()
  console.log('Started IO session')

  // const FILE = 'src/stories/example.stories.tsx'
  // const FILE = '/home/danny/dev/nimbleway/pages/login.tsx'
  // const FILE = '/home/danny/dev/nimbleway/src/components/Layout/SideNav/SideNav.tsx'
  const FILE = 'src/Components/PropsEditor/PropsEditor.stories.tsx'

  ioSession.projectService.openClientFile(path.resolve(FILE))
  const project: Project = ioSession.projectService.getDefaultProjectForFile(asNormalizedPath(FILE), true)!

  if (!project) throw new Error('Project missing')

  return getTsMethods(ioSession, project)
}
