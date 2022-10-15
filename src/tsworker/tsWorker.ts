/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as ts from '../lib/typescriptServices'
import * as edworker from 'monaco-editor-core/esm/vs/editor/editor.worker'
import { libFileMap } from '../lib/lib'
import {
  Diagnostic,
  DiagnosticRelatedInformation,
  IExtraLibs,
  TypeScriptWorker as ITypeScriptWorker,
} from './monaco.contribution'
import { type Uri, worker } from 'monaco-editor-core/esm/vs/editor/editor.api'
import { fillCacheFromStore, getFile } from './fileGetter'
import { expose } from 'comlink'
import { DocumentRegistry, TypeFlags } from 'typescript'
import type * as tstype from 'typescript'
import { Project, FileSystemHost, RuntimeDirEntry, createWrappedNode, printNode } from 'ts-morph'
import { getWrappedNodeAtPosition, getAstNodeAtPosition } from 'tsutils'

export {
  Uri,
  type worker,
  libFileMap,
  ts,
  type Diagnostic,
  type DiagnosticRelatedInformation,
  type IExtraLibs,
  type TypeScriptWorker as ITypeScriptWorker,
}

/**
 * Loading a default lib as a source file will mess up TS completely.
 * So our strategy is to hide such a text model from TS.
 * See https://github.com/microsoft/monaco-editor/issues/2182
 */
export function fileNameIsLib(resource: Uri | string): boolean {
  if (typeof resource === 'string') {
    if (/^file:\/\/\//.test(resource)) {
      return !!libFileMap[resource.substr(8)]
    }
    return false
  }
  if (resource.path.indexOf('/lib.') === 0) {
    return !!libFileMap[resource.path.slice(1)]
  }
  return false
}

const typescript = (ts as any).typescript as typeof tstype
const documentRegistry: DocumentRegistry = (ts as any).typescript.createDocumentRegistry()
export class TypeScriptWorker implements ts.LanguageServiceHost, ITypeScriptWorker {
  // --- model sync -----------------------

  private _ctx: worker.IWorkerContext
  private _extraLibs: IExtraLibs = Object.create(null)
  private _languageService = ts.createLanguageService(this, documentRegistry)
  private _compilerOptions: ts.CompilerOptions
  private _inlayHintsOptions?: ts.UserPreferences

  constructor(ctx: worker.IWorkerContext, createData: ICreateData) {
    this._ctx = ctx
    this._compilerOptions = createData.compilerOptions
    this._extraLibs = createData.extraLibs
    this._inlayHintsOptions = createData.inlayHintsOptions
  }

  // --- language service host ---------------

  getCompilationSettings(): ts.CompilerOptions {
    return this._compilerOptions
  }

  getLanguageService(): ts.LanguageService {
    return this._languageService
  }

  getExtraLibs(): IExtraLibs {
    return this._extraLibs
  }

  getScriptFileNames(): string[] {
    const allModels = this._ctx.getMirrorModels().map((model) => model.uri)
    const models = allModels.filter((uri) => !fileNameIsLib(uri)).map((uri) => uri.toString(true))
    return models.concat(Object.keys(this._extraLibs))
  }

  private _getModel(fileName: string): worker.IMirrorModel | null {
    let models = this._ctx.getMirrorModels()
    for (let i = 0; i < models.length; i++) {
      const uri = models[i].uri
      if (uri.toString() === fileName || uri.toString(true) === fileName) {
        return models[i]
      }
    }
    return null
  }

  getScriptVersion(fileName: string): string {
    let model = this._getModel(fileName)
    if (model) {
      return model.version.toString()
    } else if (this.isDefaultLibFileName(fileName)) {
      // default lib is static
      return '1'
    } else if (fileName in this._extraLibs) {
      return String(this._extraLibs[fileName].version)
    }
    return ''
  }

  async getScriptText(fileName: string): Promise<string | undefined> {
    return this._getScriptText(fileName)
  }

  _getScriptText(fileName: string): string | undefined {
    let text: string
    let model = this._getModel(fileName)
    const libizedFileName = 'lib.' + fileName + '.d.ts'
    if (model) {
      // a true editor model
      text = model.getValue()
    } else if (fileName in libFileMap) {
      text = libFileMap[fileName]
    } else if (libizedFileName in libFileMap) {
      text = libFileMap[libizedFileName]
    } else if (fileName in this._extraLibs) {
      // extra lib
      text = this._extraLibs[fileName].content
    } else {
      return getFile(fileName)
    }

    return text
  }

  getScriptSnapshot(fileName: string): ts.IScriptSnapshot | undefined {
    const text = this._getScriptText(fileName)
    if (text === undefined) {
      return
    }

    return <ts.IScriptSnapshot>{
      getText: (start, end) => text.substring(start, end),
      getLength: () => text.length,
      getChangeRange: () => undefined,
    }
  }

  getScriptKind?(fileName: string): ts.ScriptKind {
    const suffix = fileName.substr(fileName.lastIndexOf('.') + 1)
    switch (suffix) {
      case 'ts':
        return ts.ScriptKind.TS
      case 'tsx':
        return ts.ScriptKind.TSX
      case 'js':
        return ts.ScriptKind.JS
      case 'jsx':
        return ts.ScriptKind.JSX
      default:
        return this.getCompilationSettings().allowJs ? ts.ScriptKind.JS : ts.ScriptKind.TS
    }
  }

  getCurrentDirectory(): string {
    return ''
  }

  getDefaultLibFileName(options: ts.CompilerOptions): string {
    switch (options.target) {
      case 99 /* ESNext */:
        const esnext = 'lib.esnext.full.d.ts'
        if (esnext in libFileMap || esnext in this._extraLibs) return esnext
      case 7 /* ES2020 */:
      case 6 /* ES2019 */:
      case 5 /* ES2018 */:
      case 4 /* ES2017 */:
      case 3 /* ES2016 */:
      case 2 /* ES2015 */:
      default:
        // Support a dynamic lookup for the ES20XX version based on the target
        // which is safe unless TC39 changes their numbering system
        const eslib = `lib.es${2013 + (options.target || 99)}.full.d.ts`
        // Note: This also looks in _extraLibs, If you want
        // to add support for additional target options, you will need to
        // add the extra dts files to _extraLibs via the API.
        if (eslib in libFileMap || eslib in this._extraLibs) {
          return eslib
        }

        return 'lib.es6.d.ts' // We don't use lib.es2015.full.d.ts due to breaking change.
      case 1:
      case 0:
        return 'lib.d.ts'
    }
  }

  isDefaultLibFileName(fileName: string): boolean {
    return fileName === this.getDefaultLibFileName(this._compilerOptions)
  }

  readFile(path: string): string | undefined {
    return this._getScriptText(path)
  }

  fileExists(path: string): boolean {
    return this._getScriptText(path) !== undefined
  }

  async getLibFiles(): Promise<Record<string, string>> {
    return libFileMap
  }

  // --- language features

  private static clearFiles(tsDiagnostics: ts.Diagnostic[]): Diagnostic[] {
    // Clear the `file` field, which cannot be JSON'yfied because it
    // contains cyclic data structures, except for the `fileName`
    // property.
    // Do a deep clone so we don't mutate the ts.Diagnostic object (see https://github.com/microsoft/monaco-editor/issues/2392)
    const diagnostics: Diagnostic[] = []
    for (const tsDiagnostic of tsDiagnostics) {
      const diagnostic: Diagnostic = { ...tsDiagnostic }
      diagnostic.file = diagnostic.file ? { fileName: diagnostic.file.fileName } : undefined
      if (tsDiagnostic.relatedInformation) {
        diagnostic.relatedInformation = []
        for (const tsRelatedDiagnostic of tsDiagnostic.relatedInformation) {
          const relatedDiagnostic: DiagnosticRelatedInformation = { ...tsRelatedDiagnostic }
          relatedDiagnostic.file = relatedDiagnostic.file
            ? { fileName: relatedDiagnostic.file.fileName }
            : undefined
          diagnostic.relatedInformation.push(relatedDiagnostic)
        }
      }
      diagnostics.push(diagnostic)
    }
    return diagnostics
  }

  async getSyntacticDiagnostics(fileName: string): Promise<Diagnostic[]> {
    if (fileNameIsLib(fileName)) {
      return []
    }
    const diagnostics = this._languageService.getSyntacticDiagnostics(fileName)
    return TypeScriptWorker.clearFiles(diagnostics)
  }

  async getSemanticDiagnostics(fileName: string): Promise<Diagnostic[]> {
    if (fileNameIsLib(fileName)) {
      return []
    }
    const diagnostics = this._languageService.getSemanticDiagnostics(fileName)
    return TypeScriptWorker.clearFiles(diagnostics)
  }

  async getSuggestionDiagnostics(fileName: string): Promise<Diagnostic[]> {
    if (fileNameIsLib(fileName)) {
      return []
    }
    const diagnostics = this._languageService.getSuggestionDiagnostics(fileName)
    return TypeScriptWorker.clearFiles(diagnostics)
  }

  async getCompilerOptionsDiagnostics(fileName: string): Promise<Diagnostic[]> {
    if (fileNameIsLib(fileName)) {
      return []
    }
    const diagnostics = this._languageService.getCompilerOptionsDiagnostics()
    return TypeScriptWorker.clearFiles(diagnostics)
  }

  async getCompletionsAtPosition(fileName: string, position: number): Promise<ts.CompletionInfo | undefined> {
    if (fileNameIsLib(fileName)) {
      return undefined
    }

    const host = new MyFileSystemHost(this)
    const program = this._languageService.getProgram()!

    const sourceFile = program.getSourceFile('file:///1/1.tsx')
    self.s = sourceFile
    const checker = program.getTypeChecker()

    self.c = checker

    const file = program.getSourceFile('file:///1/1.tsx')

    const detectedComponents = []
    for (const statement of sourceFile!.statements) {
      // console.log(statement)
      if (typescript.isVariableStatement(statement)) {
        for (const declaration of statement.declarationList.declarations) {
          // const node = createWrappedNode(declaration.name, {
          //   compilerOptions: program.getCompilerOptions(),
          //   sourceFile: file,
          //   typeChecker: program.getTypeChecker(),
          // })
          // console.log(11111, node)
          //
          // self.node = node

          // 🚀 This is where the magic happens.
          const type = checker.getTypeAtLocation(declaration.name)

          // A type that has call signatures is a function type.
          for (const callSignature of type.getCallSignatures()) {
            // console.log(checker.getSignatureFromDeclaration(callSignature.getDeclaration()))
            // console.log(typescript.SyntaxKind.StringKeyword)
            const pType = checker.getTypeOfSymbolAtLocation(
              callSignature.getParameters()[0],
              declaration.name
            )

            for (const prop of pType.getProperties()) {
              const sType = checker.getNonNullableType(checker.getTypeOfSymbolAtLocation(prop, declaration.name))
              const typeNode = checker.typeToTypeNode(sType, declaration.name, undefined)
              checker.isTypeAssignableTo
              if (
                checker.isTypeAssignableTo(sType, checker.getStringType()) ||
                checker.isTypeAssignableTo(checker.getStringType(), sType)
              ) {
                // console.log(sType, typeNode)
                console.log(prop.name, sType, typeNode)
              }
            }

            // console.log(321312312, callSignature.getParameters()[0], callSignature.parameters)
            const returnType = callSignature.getReturnType()
            if (returnType.symbol?.getEscapedName().toString() === 'Element') {
              detectedComponents.push(declaration.name.text)
            }
          }
        }
      }
    }
    self.ls = this._languageService
    return this._languageService.getCompletionsAtPosition(fileName, position, undefined)
  }

  async getCompletionEntryDetails(
    fileName: string,
    position: number,
    entry: string
  ): Promise<ts.CompletionEntryDetails | undefined> {
    return this._languageService.getCompletionEntryDetails(
      fileName,
      position,
      entry,
      undefined,
      undefined,
      undefined,
      undefined
    )
  }

  async getSignatureHelpItems(
    fileName: string,
    position: number,
    options: ts.SignatureHelpItemsOptions | undefined
  ): Promise<ts.SignatureHelpItems | undefined> {
    if (fileNameIsLib(fileName)) {
      return undefined
    }
    return this._languageService.getSignatureHelpItems(fileName, position, options)
  }

  async getQuickInfoAtPosition(fileName: string, position: number): Promise<ts.QuickInfo | undefined> {
    if (fileNameIsLib(fileName)) {
      return undefined
    }
    return this._languageService.getQuickInfoAtPosition(fileName, position)
  }

  async getOccurrencesAtPosition(
    fileName: string,
    position: number
  ): Promise<ReadonlyArray<ts.ReferenceEntry> | undefined> {
    if (fileNameIsLib(fileName)) {
      return undefined
    }
    return this._languageService.getOccurrencesAtPosition(fileName, position)
  }

  async getDefinitionAtPosition(
    fileName: string,
    position: number
  ): Promise<ReadonlyArray<ts.DefinitionInfo> | undefined> {
    if (fileNameIsLib(fileName)) {
      return undefined
    }
    return this._languageService.getDefinitionAtPosition(fileName, position)
  }

  async getReferencesAtPosition(
    fileName: string,
    position: number
  ): Promise<ts.ReferenceEntry[] | undefined> {
    if (fileNameIsLib(fileName)) {
      return undefined
    }
    return this._languageService.getReferencesAtPosition(fileName, position)
  }

  async getNavigationBarItems(fileName: string): Promise<ts.NavigationBarItem[]> {
    if (fileNameIsLib(fileName)) {
      return []
    }
    return this._languageService.getNavigationBarItems(fileName)
  }

  async getFormattingEditsForDocument(
    fileName: string,
    options: ts.FormatCodeOptions
  ): Promise<ts.TextChange[]> {
    if (fileNameIsLib(fileName)) {
      return []
    }
    return this._languageService.getFormattingEditsForDocument(fileName, options)
  }

  async getFormattingEditsForRange(
    fileName: string,
    start: number,
    end: number,
    options: ts.FormatCodeOptions
  ): Promise<ts.TextChange[]> {
    if (fileNameIsLib(fileName)) {
      return []
    }
    return this._languageService.getFormattingEditsForRange(fileName, start, end, options)
  }

  async getFormattingEditsAfterKeystroke(
    fileName: string,
    postion: number,
    ch: string,
    options: ts.FormatCodeOptions
  ): Promise<ts.TextChange[]> {
    if (fileNameIsLib(fileName)) {
      return []
    }
    return this._languageService.getFormattingEditsAfterKeystroke(fileName, postion, ch, options)
  }

  async findRenameLocations(
    fileName: string,
    position: number,
    findInStrings: boolean,
    findInComments: boolean,
    providePrefixAndSuffixTextForRename: boolean
  ): Promise<readonly ts.RenameLocation[] | undefined> {
    if (fileNameIsLib(fileName)) {
      return undefined
    }
    return this._languageService.findRenameLocations(
      fileName,
      position,
      findInStrings,
      findInComments,
      providePrefixAndSuffixTextForRename
    )
  }

  async getRenameInfo(
    fileName: string,
    position: number,
    options: ts.RenameInfoOptions
  ): Promise<ts.RenameInfo> {
    if (fileNameIsLib(fileName)) {
      return { canRename: false, localizedErrorMessage: 'Cannot rename in lib file' }
    }
    return this._languageService.getRenameInfo(fileName, position, options)
  }

  async getEmitOutput(fileName: string): Promise<ts.EmitOutput> {
    if (fileNameIsLib(fileName)) {
      return { outputFiles: [], emitSkipped: true }
    }
    return this._languageService.getEmitOutput(fileName)
  }

  async getCodeFixesAtPosition(
    fileName: string,
    start: number,
    end: number,
    errorCodes: number[],
    formatOptions: ts.FormatCodeOptions
  ): Promise<ReadonlyArray<ts.CodeFixAction>> {
    if (fileNameIsLib(fileName)) {
      return []
    }
    const preferences = {}
    try {
      return this._languageService.getCodeFixesAtPosition(
        fileName,
        start,
        end,
        errorCodes,
        formatOptions,
        preferences
      )
    } catch {
      return []
    }
  }

  async updateExtraLibs(extraLibs: IExtraLibs): Promise<void> {
    this._extraLibs = extraLibs
  }

  async provideInlayHints(fileName: string, start: number, end: number): Promise<readonly ts.InlayHint[]> {
    if (fileNameIsLib(fileName)) {
      return []
    }
    const preferences: ts.UserPreferences = this._inlayHintsOptions ?? {}
    const span: ts.TextSpan = {
      start,
      length: end - start,
    }

    try {
      return this._languageService.provideInlayHints(fileName, span, preferences)
    } catch {
      return []
    }
  }
}

class MyFileSystemHost implements FileSystemHost {
  constructor(private tsWorker: TypeScriptWorker) {}

  copy(srcPath: string, destPath: string): Promise<void> {
    return Promise.resolve(undefined)
  }

  copySync(srcPath: string, destPath: string): void {}

  delete(path: string): Promise<void> {
    return Promise.resolve(undefined)
  }

  deleteSync(path: string): void {}

  directoryExists(dirPath: string): Promise<boolean> {
    return Promise.resolve(false)
  }

  directoryExistsSync(dirPath: string): boolean {
    return false
  }

  async fileExists(filePath: string): Promise<boolean> {
    return this.tsWorker.fileExists(filePath)
  }

  fileExistsSync(filePath: string): boolean {
    return this.tsWorker.fileExists(filePath)
  }

  getCurrentDirectory(): string {
    return ''
  }

  glob(patterns: ReadonlyArray<string>): Promise<string[]> {
    return Promise.resolve([])
  }

  globSync(patterns: ReadonlyArray<string>): string[] {
    return []
  }

  isCaseSensitive(): boolean {
    return false
  }

  mkdir(dirPath: string): Promise<void> {
    return Promise.resolve(undefined)
  }

  mkdirSync(dirPath: string): void {}

  move(srcPath: string, destPath: string): Promise<void> {
    return Promise.resolve(undefined)
  }

  moveSync(srcPath: string, destPath: string): void {}

  readDirSync(dirPath: string): RuntimeDirEntry[] {
    return []
  }

  async readFile(filePath: string, encoding?: string): Promise<string> {
    return this.tsWorker.readFile(filePath) || '' //TODO?
  }

  readFileSync(filePath: string, encoding?: string): string {
    return this.tsWorker.readFile(filePath) || '' //TODO?
  }

  realpathSync(path: string): string {
    return ''
  }

  writeFile(filePath: string, fileText: string): Promise<void> {
    return Promise.resolve(undefined)
  }

  writeFileSync(filePath: string, fileText: string): void {}
}

export interface ICreateData {
  compilerOptions: ts.CompilerOptions
  extraLibs: IExtraLibs
  customWorkerPath?: string
  inlayHintsOptions?: ts.UserPreferences
}

/** The shape of the factory */
export interface CustomTSWebWorkerFactory {
  (
    TSWorkerClass: typeof TypeScriptWorker,
    tsc: typeof ts,
    libs: Record<string, string>
  ): typeof TypeScriptWorker
}

// declare global {
// 	var importScripts: (path: string) => void | undefined;
// 	var customTSWorkerFactory: CustomTSWebWorkerFactory | undefined;
// }

export function create(ctx: worker.IWorkerContext, createData: ICreateData): TypeScriptWorker {
  let TSWorkerClass = TypeScriptWorker
  if (createData.customWorkerPath) {
    if (typeof importScripts === 'undefined') {
      console.warn(
        'Monaco is not using webworkers for background tasks, and that is needed to support the customWorkerPath flag'
      )
    } else {
      importScripts(createData.customWorkerPath)

      const workerFactoryFunc: CustomTSWebWorkerFactory | undefined = (self as any).customTSWorkerFactory
      if (!workerFactoryFunc) {
        throw new Error(
          `The script at ${createData.customWorkerPath} does not add customTSWorkerFactory to self`
        )
      }

      TSWorkerClass = workerFactoryFunc(TypeScriptWorker, ts, libFileMap)
    }
  }

  return new TSWorkerClass(ctx, createData)
}

expose({
  init: async (cb: () => void) => {
    await fillCacheFromStore()

    cb()
  },
})

self.onmessage = () => {
  edworker.initialize((ctx: worker.IWorkerContext, createData: ICreateData) => {
    return create(ctx, createData)
  })
}
/** Allows for clients to have access to the same version of TypeScript that the worker uses */
// @ts-ignore
globalThis.ts = ts.typescript
