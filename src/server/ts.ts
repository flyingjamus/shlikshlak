import * as fs from 'fs'
import * as ts from 'typescript'
import {
  CharacterCodes,
  factory,
  FileTextChanges,
  formatting,
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

const FILE = 'src/stories/example.stories.tsx'
const rootFileNames = [FILE]
const options = COMPILER_OPTIONS
const files: ts.MapLike<{ version: number }> = {}

// initialize the list of files
rootFileNames.forEach((fileName) => {
  files[fileName] = { version: 0 }
})

// Create the language service host to allow the LS to communicate with the host
const servicesHost: ts.LanguageServiceHost = {
  getScriptFileNames: () => rootFileNames,
  getScriptVersion: (fileName) => files[fileName] && files[fileName].version.toString(),
  getScriptSnapshot: (fileName) => {
    if (!fs.existsSync(fileName)) {
      return undefined
    }

    return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString())
  },
  getCurrentDirectory: () => process.cwd(),
  getCompilationSettings: () => options,
  getDefaultLibFileName: (options) =>
    path.resolve(process.cwd(), 'node_modules/typescript/lib', ts.getDefaultLibFileName(options)),
  fileExists: ts.sys.fileExists,
  readFile: ts.sys.readFile,
  readDirectory: ts.sys.readDirectory,
  directoryExists: ts.sys.directoryExists,
  getDirectories: ts.sys.getDirectories,
  writeFile(fileName: string, content: string) {
    console.log('Writefile', fileName, content)
  },
}

// Create the language service files
const languageService = ts.createLanguageService(servicesHost, ts.createDocumentRegistry())
const services = languageService
const program = languageService.getProgram()!
const checker = program.getTypeChecker()!

function getTokenAtFilename(fileName: string, position: number) {
  const program = languageService.getProgram()
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
  console.log(line, col, fileName)
  const sourceFile = requireSourceFile(fileName)
  return getPanelsAtPosition(FILE, sourceFile.getPositionOfLineAndCharacter(line, col))
}

export async function getPanelsAtPosition(fileName: string, position: number): Promise<PanelsResponse> {
  const parent = getParentTokenAtPosition(fileName, position)
  if (parent) {
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
    const existingIncludingChildren = [
      ...existingAttributes,
      ...(isJsxElement(parent.parent)
        ? parent.parent.children.map((v) => {
            if (isJsxText(v))
              return {
                name: 'children',
                location: {
                  pos: v.pos,
                  end: v.end,
                },
                value: v.getText(),
              }
          })
        : []),
    ].filter(isDefined)
    const typeAtLocation = checker.getContextualType(parent.attributes)

    if (typeAtLocation) {
      const sxPropsType = getExport('@mui/system', 'SystemCssProperties')
      const context: MatcherContext = {
        c: checker,
        types: { SxProps: sxPropsType },
      }
      const attributes = [...typeAtLocation.getProperties()].map((prop) => {
        const type = checker.getNonNullableType(checker.getTypeOfSymbol(prop))

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
  const sourceFile = program.getSourceFile(fileName)
  if (!sourceFile) throw new Error('Source file not found ' + fileName)
  return sourceFile
}

function getExport(moduleName: string, name: string) {
  const rootFileName = program.getRootFileNames()[0]
  const resolved = resolveModuleName(
    moduleName,
    rootFileName,
    servicesHost.getCompilationSettings(),
    servicesHost
  )
  if (!resolved.resolvedModule) throw new Error('Not found')
  const sourceFile = requireSourceFile(resolved.resolvedModule.resolvedFileName)

  const symbolAtLocation = checker.getSymbolAtLocation(sourceFile)!
  const exportsOfModule = checker.getExportsOfModule(getAliasedSymbolIfNecessary(symbolAtLocation))
  const moduleExport = exportsOfModule.find((v) => v.name === name)!
  if (!moduleExport) throw new Error('Not found')

  const declaredTypeOfSymbol = checker.getDeclaredTypeOfSymbol(moduleExport)
  return declaredTypeOfSymbol
  return checker.getNonNullableType(declaredTypeOfSymbol)
}

function getAliasedSymbolIfNecessary(symbol: Symbol) {
  if ((symbol.flags & SymbolFlags.Alias) !== 0) return checker.getAliasedSymbol(symbol)
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
  const output = services.getEmitOutput(fileName)

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
  const allDiagnostics = services
    .getCompilerOptionsDiagnostics()
    .concat(services.getSyntacticDiagnostics(fileName))
    .concat(services.getSemanticDiagnostics(fileName))

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
      host: servicesHost,
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
          if (childrenNodes.length === 1) {
            t.replaceNode(sourceFile, childrenNodes[0], factory.createIdentifier(value?.toString() || ''))
          } else if (childrenNodes.length === 0) {
            t.insertNodeAt(
              sourceFile,
              childrenNodes.pos,
              factory.createIdentifier(value?.toString() || ''),
              {}
            )
          } else {
            console.error('Multiple children')
            return
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
        // formattingScanner requires the Identifier to have a context for scanning attributes with "-" (data-foo).
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
  const newContent = applyEdits(sourceFile.text, fileName, fileTextChanges)
  ts.sys.writeFile(fileName, newContent)
}

function applyEdits(text: string, textFilename: string, edits: readonly FileTextChanges[]): string {
  for (const { fileName, textChanges } of edits) {
    if (fileName !== textFilename) {
      continue
    }

    for (let i = textChanges.length - 1; i >= 0; i--) {
      const {
        newText,
        span: { start, length },
      } = textChanges[i]
      text = text.slice(0, start) + newText + text.slice(start + length)
    }
  }

  return text
}
