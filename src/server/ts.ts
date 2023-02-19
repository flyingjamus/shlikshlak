import * as fs from 'fs'
import * as ts from 'typescript'
import {
  factory,
  formatting,
  getSnapshotText,
  getTokenAtPosition,
  isJsxAttribute,
  isJsxElement,
  isJsxExpression,
  isJsxOpeningLikeElement,
  isJsxSpreadAttribute,
  isObjectLiteralExpression,
  isPropertyAssignment,
  JsxOpeningLikeElement,
  LanguageServiceMode,
  Node, normalizePath,
  resolveModuleName,
  setParent,
  Symbol,
  SymbolFlags,
  textChanges
} from 'typescript'
import { COMPILER_OPTIONS } from '../Components/Editor/COMPILER_OPTIONS'
import { ExistingAttribute, PanelsResponse } from '../Shared/PanelTypes'
import { isDefined } from 'ts-is-defined'
import { MatcherContext, PANELS } from '../tsworker/Panels'
import path from 'path'
import { SetAttributesAtPositionRequest } from '../common/api'
import { initializeNodeSystem } from './nodeServer'
import prettier from 'prettier'
import { createLogger } from './logger'
import { asNormalizedPath } from './ts/utilitiesPublic'
export const logger = createLogger('ts')

// const FILE = 'src/stories/example.stories.tsx'
const FILE = '/home/danny/dev/nimbleway/pages/login.tsx'

const { startSession, logger: ioLogger, cancellationToken } = initializeNodeSystem()
const ioSession = startSession(
  {
    globalPlugins: undefined,
    pluginProbeLocations: undefined,
    allowLocalPluginLoads: undefined,
    useSingleInferredProject: false,
    useInferredProjectPerProjectRoot: false,
    suppressDiagnosticEvents: undefined,
    noGetErrOnBackgroundUpdate: undefined,
    syntaxOnly: false,
    serverMode: LanguageServiceMode.Semantic,
  },
  ioLogger,
  cancellationToken
)

ioSession.projectService.openClientFile(path.resolve(FILE))
const project = ioSession.projectService.getDefaultProjectForFile(asNormalizedPath(FILE), true)
// ({
//   options: { ...COMPILER_OPTIONS, rootFiles: [] },
//   projectFileName: 'project',
//   rootFiles: [{ fileName: path.resolve(FILE) }],
// })
// const project = ioSession.projectService.externalProjects[0]

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

export async function getPanelsAtLocation(
  fileName: string,
  line: number,
  col: number
): Promise<PanelsResponse> {
  const sourceFile = requireSourceFile(fileName)
  return getPanelsAtPosition(sourceFile.fileName, sourceFile.getPositionOfLineAndCharacter(line, col))
}

export async function getPanelsAtPosition(fileName: string, position: number): Promise<PanelsResponse> {
  const parent = getParentTokenAtPosition(fileName, position)
  if (parent) {
    const languageService = project.getLanguageService()
    const program = languageService.getProgram()
    const typeChecker = program!.getTypeChecker()
    const typeAtLocation = typeChecker!.getContextualType(parent.attributes)
    const jsxTag = parent.parent
    const matcherContext: MatcherContext = {
      c: typeChecker!,
      types: {},
    }
    const existingAttributes: ExistingAttribute[] = parent.attributes.properties
      .map((attr) => {
        if (isJsxAttribute(attr)) {
          const initializer = attr.initializer
          const type = initializer && typeChecker.getTypeAtLocation(attr)
          console.log(typeChecker.typeToString(type))
          const value = initializer?.getText()
          const name = attr.name.escapedText.toString()
          return {
            name: name,
            value,
            hasInitializer: !!initializer,
            location: {
              pos: attr.pos,
              end: attr.end,
            },
            panels: !type
              ? []
              : name === 'children'
              ? [{ name: 'Children' } as const]
              : type
              ? PANELS.map((v) => {
                  return (v.reverseMatch || v.matcher)(type, matcherContext)
                }).filter(isDefined)
              : [],
          }
        }
      })
      .filter(isDefined)
    const existingIncludingChildren = [...existingAttributes].filter(isDefined)
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
      const attributes = [...typeAtLocation.getProperties()].map((prop) => {
        const type = typeChecker!.getNonNullableType(typeChecker!.getTypeOfSymbol(prop))

        return {
          name: prop.name,
          location: existingIncludingChildren.find((v) => v.name === prop.name)?.location,
          panels:
            prop.name === 'children'
              ? [{ name: 'Children' } as const]
              : type
              ? PANELS.map((v) => {
                  return v.matcher(type, matcherContext)
                }).filter(isDefined)
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

function requireSourceFile(fileName: string) {
  logger.debug('Require source file ' + fileName)
  const sourceFile = project.getLanguageService().getProgram()!.getSourceFile(fileName)
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
  const sourceFile = requireSourceFile(resolved.resolvedModule.resolvedFileName)

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
  return project.getLanguageService().getProgram()!.getTypeChecker()!.getNonNullableType(declaredTypeOfSymbol)
}

function getAliasedSymbolIfNecessary(symbol: Symbol) {
  if ((symbol.flags & SymbolFlags.Alias) !== 0)
    return project.getLanguageService().getProgram()!.getTypeChecker()!.getAliasedSymbol(symbol)
  return symbol
}

const getRange = (node: Node) => {
  const sourceFile = node.getSourceFile()
  const { line: startLineNumber, character: startColumn } = sourceFile.getLineAndCharacterOfPosition(node.pos)
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

export function setAttributeAtPosition(args: SetAttributesAtPositionRequest): boolean {
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
      // const initializerExpression =
      //   value !== undefined
      //     ? factory.createJsxExpression(
      //         /*dotDotDotToken*/ undefined,
      //         factory.inlineExpressions(
      //           value || '',
      //           // /* isSingleQuote */ quotePreference === QuotePreference.Single TODO!!
      //           false
      //         )
      //       )
      //     : undefined
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
      if (attrName === 'children') {
        if (childrenNodes) {
          if (childrenNodes.length) {
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
        if (value !== undefined) {
          const updates = factory.updateJsxAttribute(
            existingToken,
            name,
            factory.createJsxExpression(undefined, value)
          )
          // t.replaceNode(sourceFile, existingToken, updates, options)
          // factory.inlineExpressions()
          console.log(111, existingToken.initializer?.getText())
          t.replaceNodeWithText(sourceFile, existingToken.initializer, value)
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
        t.insertText(sourceFile, jsxAttributesNode.end, ` ${attrName}=${value}`)
      }
    }
  )
  for (const change of fileTextChanges) {
    const scriptInfo = ioSession.projectService.getScriptInfo(change.fileName)!
    ioSession.projectService.applyChangesToFile(scriptInfo, change.textChanges.values())
  }

  const languageService = project.getLanguageService()
  const program = languageService.getProgram()
  const typeChecker = program!.getTypeChecker()

  const config = prettier.resolveConfig.sync(sourceFile.fileName)
  const scriptInfo = ioSession.projectService.getScriptInfo(sourceFile.fileName)!
  try {
    const formatted = prettier.format(getSnapshotText(scriptInfo.getSnapshot()), {
      ...config,
      filepath: sourceFile.fileName,
    })
    ioSession.projectService.host.writeFile(sourceFile.fileName, formatted)
    return true
  } catch (e) {
    logger.warn('Prettier, not writing')
    logger.warn(e)
    scriptInfo.reloadFromFile()
    return false
  }
  // const diagnostics = typeChecker.getDiagnostics(sourceFile)
  // if (diagnostics.length) {
  //   return false
  // } else {
  //   ioSession.projectService.host.writeFile(sourceFile.fileName, getSnapshotText(scriptInfo.getSnapshot()))
  //   return true
  // }
}

emitFile(FILE)
