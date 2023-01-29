import * as fs from 'fs'
import * as ts from 'typescript'
import {
  factory,
  FileTextChanges,
  formatting,
  getSnapshotText,
  getTokenAtPosition,
  isJsxAttribute,
  isJsxElement,
  isJsxExpression,
  isJsxOpeningLikeElement,
  isJsxSpreadAttribute,
  isJsxText,
  isObjectLiteralExpression,
  isPropertyAssignment,
  JsxOpeningLikeElement,
  LanguageServiceMode,
  Node,
  resolveModuleName,
  setParent,
  Symbol,
  SymbolFlags,
  textChanges,
} from 'typescript'
import { COMPILER_OPTIONS } from '../Components/Editor/COMPILER_OPTIONS'
import { ExistingAttribute, PanelsResponse } from '../Shared/PanelTypes'
import { isDefined } from 'ts-is-defined'
import { MatcherContext, PANELS } from '../tsworker/Panels'
import { IRange } from 'monaco-editor-core'
import path from 'path'
import { SetAttributesAtPositionRequest } from '../common/api'
import { initializeNodeSystem } from './nodeServer'

const FILE = 'src/stories/example.stories.tsx'
const options = COMPILER_OPTIONS
const files: ts.MapLike<{ version: number }> = {}

const { serverMode, startSession, logger, cancellationToken } = initializeNodeSystem()
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
  logger,
  cancellationToken
)

// console.log(
//   // ioSession.getFileAndProject({ file: FILE }),
//   ioSession.projectService.applyChangesToFile({ file: path.resolve(FILE) })
// )
// ioSession.projectService.useSingleInferredProject
ioSession.projectService.openExternalProject({
  options: { ...COMPILER_OPTIONS, rootFiles: [] },
  projectFileName: 'project',
  rootFiles: [{ fileName: path.resolve(FILE) }],
})
const project = ioSession.projectService.externalProjects[0]

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
    const jsxTag = parent.parent
    const existingAttributes: ExistingAttribute[] = parent.attributes.properties
      // .filter((v) => v.name?.getText() === 'sx')
      .map((attr) => {
        if (isJsxAttribute(attr)) {
          const initializer = attr.initializer
          let value
          if (!initializer) {
            value = undefined
          } else if (isJsxExpression(initializer)) {
            const expression = initializer.expression
            if (expression && isObjectLiteralExpression(expression)) {
              value = expression.properties
                .map((v) => {
                  if (isPropertyAssignment(v)) {
                    return { name: v.name.getText(), value: v.initializer.getText() }
                  }
                })
                .filter(isDefined)
            } else {
              value = expression?.getText().slice(1, -1) //TODO expression
            }
          } else {
            const initializerText = initializer?.getText()
            if (initializerText?.[0] === '{') {
              if (initializerText?.[1] === '"') {
                value = initializerText?.slice(2, -2).replaceAll('\\"', '"')
              } else if (initializerText?.[1] === "'") {
                value = initializerText?.slice(2, -2).replaceAll("\\'", "'")
              } else {
                value = initializerText?.slice(2, -2)
              }
            } else {
              value = initializerText?.slice(1, -1)
            }
          }
          return {
            name: attr.name.escapedText.toString(),
            value,
            hasInitializer: !!initializer,
            location: {
              pos: attr.pos,
              end: attr.end,
            },
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
        value: jsxTag.getText().slice(childrenStart - jsxTag.pos, childrenEnd - jsxTag.pos),
      })
    }
    const typeAtLocation = project
      .getLanguageService()
      .getProgram()!
      .getTypeChecker()!
      .getContextualType(parent.attributes)

    if (typeAtLocation) {
      // const sxPropsType = getExport('@mui/system', 'SystemCssProperties')
      const context: MatcherContext = {
        c: project.getLanguageService().getProgram()!.getTypeChecker()!,
        // types: { SxProps: sxPropsType },
        types: {},
      }
      const attributes = [...typeAtLocation.getProperties()].map((prop) => {
        const type = project
          .getLanguageService()
          .getProgram()!
          .getTypeChecker()!
          .getNonNullableType(
            project.getLanguageService().getProgram()!.getTypeChecker()!.getTypeOfSymbol(prop)
          )

        return {
          name: prop.name,
          location: existingIncludingChildren.find((v) => v.name === prop.name)?.location,
          panels: type
            ? PANELS.map((v) => {
                return v.matcher(type, context)
              }).filter(isDefined)
            : [],
        }
      })

      return {
        attributes: [...attributes],
        existingAttributes: existingIncludingChildren,
        location: parent.attributes.pos,
        fileName,
        range: getRange(parent),
      }
    }
  }
  return { attributes: [], existingAttributes: [] }
}

function requireSourceFile(fileName: string) {
  // console.log(31231212, project.getScriptInfo(fileName))
  // project.projectService.applyChangesToFile(fileName)
  // console.log(31231212, project.getScriptInfo(fileName))
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

const getRange = (node: Node): IRange => {
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

export function setAttributeAtPosition({
  fileName,
  position,
  attrName,
  value,
}: SetAttributesAtPositionRequest): void {
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
      const initializerExpression =
        value !== undefined && value !== true
          ? factory.createJsxExpression(
              /*dotDotDotToken*/ undefined,
              factory.createStringLiteral(
                value || '',
                // /* isSingleQuote */ quotePreference === QuotePreference.Single TODO!!
                false
              )
            )
          : undefined
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
      const jsxNode = token.parent.parent.parent.parent
      const childrenNodes = isJsxElement(jsxNode) && jsxNode.children
      const existingToken = jsxAttributesNode?.properties.find((v) => v.name?.getText() === attrName)
      if (attrName === 'children') {
        if (childrenNodes) {
          if (childrenNodes.length) {
            t.replaceNode(sourceFile, childrenNodes[0], factory.createIdentifier(value?.toString() || ''))
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
          const updates = factory.updateJsxAttribute(existingToken, name, initializerExpression)
          t.replaceNode(sourceFile, existingToken, updates, options)
        } else {
          t.deleteNode(sourceFile, existingToken)
        }
      } else {
        const name = factory.createIdentifier(attrName)
        const jsxAttribute = factory.createJsxAttribute(name, initializerExpression)
        const hasSpreadAttribute = jsxAttributesNode.properties.some(isJsxSpreadAttribute)
        setParent(name, jsxAttribute)
        const jsxAttributes = factory.createJsxAttributes(
          hasSpreadAttribute
            ? [jsxAttribute, ...jsxAttributesNode.properties]
            : [...jsxAttributesNode.properties, jsxAttribute]
        )
        const options = { prefix: jsxAttributesNode.pos === jsxAttributesNode.end ? ' ' : undefined }
        t.replaceNode(sourceFile, jsxAttributesNode, jsxAttributes, options)
      }
    }
  )
  for (const change of fileTextChanges) {
    const scriptInfo = ioSession.projectService.getScriptInfo(change.fileName)!
    ioSession.projectService.applyChangesToFile(scriptInfo, change.textChanges.values())
    ioSession.projectService.host.writeFile(change.fileName, getSnapshotText(scriptInfo.getSnapshot()))
  }
}
