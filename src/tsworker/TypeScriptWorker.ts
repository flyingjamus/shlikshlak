/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  canHaveModifiers,
  createSourceFile,
  factory,
  FileTextChanges,
  forEachChildRecursively,
  formatting,
  getModifiers,
  isExportAssignment,
  isExportDeclaration,
  isExportModifier,
  isExportSpecifier,
  isJsxAttribute,
  isJsxElement,
  isJsxExpression,
  isJsxOpeningLikeElement,
  isJsxSpreadAttribute,
  isJsxText,
  isObjectLiteralExpression,
  isPropertyAssignment,
  Node,
  resolveModuleName,
  ScriptKind,
  ScriptTarget,
  setParent,
  Symbol,
  SymbolFlags,
  SyntaxKind,
  textChanges,
} from 'typescript'
import { BaseTypeScriptWorker } from './BaseTypeScriptWorker'
import { isDefined } from 'ts-is-defined'
import { MatcherContext, PANELS } from './Panels'
import { ExistingAttribute, PanelsResponse } from '../Shared/PanelTypes'
import type { IRange } from 'monaco-editor-core'
// import * as parse from 'gitignore-to-glob'
import path from 'path'
import fs from 'fs'
import { ParsedStoriesResult } from '../stories/ParseStories/types'
import getStorynameAndMeta from '../stories/ParseStories/parse/get-storyname-and-meta'
import getDefaultExport from '../stories/ParseStories/parse/get-default-export'
import getNamedExports from '../stories/ParseStories/parse/get-named-exports'
import { fileNameIsLib } from './fileNameIsLib'

// export const convertSingleEntry = async (entry: string, code: string) => {
//   const result: ParsedStoriesResult = {
//     entry,
//     stories: [],
//     exportDefaultProps: { title: undefined, meta: undefined },
//     namedExportToMeta: {},
//     namedExportToStoryName: {},
//     storyParams: {},
//     storySource: code.replace(/\r/g, ''),
//   }
//   // const ast = getAst(code, entry)
//   // traverse(ast, {
//   //   Program: getStorynameAndMeta.bind(this, result),
//   // })
//   // traverse(ast, {
//   //   ExportDefaultDeclaration: getDefaultExport.bind(this, result),
//   // })
//   // traverse(ast, {
//   //   ExportNamedDeclaration: getNamedExports.bind(this, result),
//   // })
//   return result
// }

export class TypeScriptWorker extends BaseTypeScriptWorker {
  override getScriptFileNames(): string[] {
    const gitIgnore = this.readFile('/.gitignore')
      ?.match(/[^\r\n]+/g)
      ?.filter((pattern) => !!pattern && pattern[0] !== '#')

    const strings = this.readDirectory('/', ['tsx'], gitIgnore)
    return strings
  }

  async getAllComponents() {
    const componentFiles = this.getScriptFileNames()
    for (const filename of componentFiles) {
      const contents = this.readFile(filename)
      if (!contents) {
        console.error(filename + ' not found')
        continue
      }

      const sourceFile = this.program.getSourceFile(filename)

      // console.log(1111)
      // sourceFile.ex
      console.log(
        sourceFile?.symbol &&
          this.checker.getExportsOfModule(sourceFile?.symbol).map((v) =>
            //
            this.checker.getTypeOfSymbol(v)
          )
      )

      // sourceFile?.forEachChild((node) => {
      //   // console.log(node.getText(), node.kind)
      //
      //
      //   // switch (node.kind) {
      //   //   //   // case SyntaxKind.ImportDeclaration:
      //   //   //   //   // requires.push(node.moduleSpecifier.text)
      //   //   //   //   break
      //   //   case SyntaxKind.VariableStatement: {
      //   //     // if (isExportAssignment(node))
      //   //     const modifiers = (canHaveModifiers(node) && getModifiers(node)) || []
      //   //     if (modifiers?.some(isExportModifier)) console.log(node.getText())
      //   //
      //   //     // For syntax 'export ... from '...'''
      //   //     // if (node.moduleSpecifier) {
      //   //     //   // requires.push(node.moduleSpecifier.text)
      //   //     // }
      //   //     break
      //   //   }
      //   // }
      // })
    }
  }
  getAliasedSymbolIfNecessary(symbol: Symbol) {
    if ((symbol.flags & SymbolFlags.Alias) !== 0) return this.checker.getAliasedSymbol(symbol)
    return symbol
  }

  getExport(moduleName: string, name: string) {
    const rootFileName = this.program.getRootFileNames()[0]
    const resolved = resolveModuleName(moduleName, rootFileName, this.getCompilationSettings(), this)
    if (!resolved.resolvedModule) throw new Error('Not found')
    const sourceFile = this.requireSourceFile(resolved.resolvedModule.resolvedFileName)

    const symbolAtLocation = this.checker.getSymbolAtLocation(sourceFile)!
    const exportsOfModule = this.checker.getExportsOfModule(
      this.getAliasedSymbolIfNecessary(symbolAtLocation)
    )
    const moduleExport = exportsOfModule.find((v) => v.name === name)!
    if (!moduleExport) throw new Error('Not found')

    const declaredTypeOfSymbol = this.checker.getDeclaredTypeOfSymbol(moduleExport)
    return declaredTypeOfSymbol
    return this.checker.getNonNullableType(declaredTypeOfSymbol)
  }

  async getPanelsAtPosition(fileName: string, position: number): Promise<PanelsResponse> {
    const parent = this.getParentTokenAtPosition(fileName, position)
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
      const typeAtLocation = this.checker.getContextualType(parent.attributes)

      if (typeAtLocation) {
        const sxPropsType = this.getExport('@mui/system', 'SystemCssProperties')
        const context: MatcherContext = {
          c: this.checker,
          w: this,
          types: { SxProps: sxPropsType },
        }
        const attributes = [...typeAtLocation.getProperties()].map((prop) => {
          const type = this.checker.getNonNullableType(this.checker.getTypeOfSymbol(prop))

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
