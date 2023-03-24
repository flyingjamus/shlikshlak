/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Node, resolveModuleName, Symbol, SymbolFlags } from 'typescript'
import { BaseTypeScriptWorker } from './BaseTypeScriptWorker'
import type { IRange } from 'monaco-editor-core'
// import * as parse from 'gitignore-to-glob'

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
