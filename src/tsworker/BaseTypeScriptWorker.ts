import typescript, { DocumentRegistry } from 'typescript'
import { AppFile, fileExists, getFile, getFileVersion } from './fileGetter'
import {
  Diagnostic,
  DiagnosticRelatedInformation,
  IExtraLibs,
  TypeScriptWorker as ITypeScriptWorker,
} from './monaco.contribution'
import { worker } from 'monaco-editor-core'
import { PANELS, TypeChecker } from './Panels'
import { PanelsResponse } from '../Shared/PanelTypes'
import { isDefined } from 'ts-is-defined'
import { libFileMap } from '../lib/lib'
import { fileNameIsLib } from './fileNameIsLib'
import { ICreateData } from './ICreateData'

const documentRegistry: DocumentRegistry = typescript.createDocumentRegistry()

export class BaseTypeScriptWorker implements typescript.LanguageServiceHost, ITypeScriptWorker {
  private _ctx: worker.IWorkerContext
  private _extraLibs: IExtraLibs = Object.create(null)
  private _compilerOptions: typescript.CompilerOptions
  private _inlayHintsOptions?: typescript.UserPreferences
  private _languageService = typescript.createLanguageService(this, documentRegistry)

  constructor(ctx: worker.IWorkerContext, createData: ICreateData) {
    this._ctx = ctx
    this._compilerOptions = createData.compilerOptions
    this._extraLibs = createData.extraLibs
    this._inlayHintsOptions = createData.inlayHintsOptions
  }

  getCompilationSettings(): typescript.CompilerOptions {
    return this._compilerOptions
  }

  getLanguageService(): typescript.LanguageService {
    return this._languageService
  }

  init() {
    // console.log(111111)
    // this.project.addSourceFileAtPath('/src/stories/Header.tsx')
    // console.log(222222)
    // this.project.resolveSourceFileDependencies()
    // console.log(3333)
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
    const models = this._ctx.getMirrorModels()
    for (let i = 0; i < models.length; i++) {
      const uri = models[i].uri
      if (uri.toString() === fileName || uri.toString(true) === fileName) {
        return models[i]
      }
    }
    return null
  }

  getScriptVersion(fileName: string): string {
    const model = this._getModel(fileName)
    if (model) {
      return model.version.toString()
    } else if (this.isDefaultLibFileName(fileName)) {
      // default lib is static
      return '1'
    } else if (fileName in this._extraLibs) {
      return String(this._extraLibs[fileName].version)
    }
    const version = getFileVersion(fileName)?.toString() || ''
    return version || ''
  }

  async getScriptText(fileName: string): Promise<string | undefined> {
    return this.getFileText(fileName)
  }

  getSystemFileText(fileName: string): string | undefined {
    const model = this._getModel(fileName)
    const libizedFileName = 'lib.' + fileName + '.d.ts'
    if (model) {
      // a true editor model
      return model.getValue()
    } else if (fileName in libFileMap) {
      return libFileMap[fileName]
    } else if (libizedFileName in libFileMap) {
      return libFileMap[libizedFileName]
    } else if (fileName in this._extraLibs) {
      return this._extraLibs[fileName].content
    }
  }

  getFile(fileName: string): AppFile {
    const systemFileText = this.getSystemFileText(fileName)
    if (systemFileText) {
      return { version: 0, exists: true, type: 'FILE', contents: systemFileText }
    }
    return getFile(fileName)
  }

  getFileText(fileName: string) {
    const file = this.getFile(fileName)
    return (file.exists && file.contents) || undefined
  }

  getScriptSnapshot(fileName: string): typescript.IScriptSnapshot | undefined {
    const text = this.getFileText(fileName)
    if (text === undefined) {
      return
    }

    return typescript.ScriptSnapshot.fromString(text)
  }

  getScriptKind?(fileName: string): typescript.ScriptKind {
    const suffix = fileName.substr(fileName.lastIndexOf('.') + 1)
    switch (suffix) {
      case 'ts':
        return typescript.ScriptKind.TS
      case 'tsx':
        return typescript.ScriptKind.TSX
      case 'js':
        return typescript.ScriptKind.JS
      case 'jsx':
        return typescript.ScriptKind.JSX
      default:
        return this.getCompilationSettings().allowJs ? typescript.ScriptKind.JS : typescript.ScriptKind.TS
    }
  }

  getCurrentDirectory(): string {
    return '/'
  }

  getDefaultLibFileName(options: typescript.CompilerOptions): string {
    const esnext = 'lib.esnext.full.d.ts'
    const eslib = `lib.es${2013 + (options.target || 99)}.full.d.ts`
    switch (options.target) {
      case 99 /* ESNext */:
        if (esnext in libFileMap || esnext in this._extraLibs) return esnext
      // eslint-disable-next-line no-fallthrough
      case 7 /* ES2020 */:
      case 6 /* ES2019 */:
      case 5 /* ES2018 */:
      case 4 /* ES2017 */:
      case 3 /* ES2016 */:
      case 2 /* ES2015 */:
      default:
        // Support a dynamic lookup for the ES20XX version based on the target
        // which is safe unless TC39 changes their numbering system
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
    return this.getFileText(path)
  }

  fileExists(path: string): boolean {
    return fileExists(path)
  }

  directoryExists(directoryName: string): boolean {
    return this.getFile(directoryName).exists
  }

  async getLibFiles(): Promise<Record<string, string>> {
    return libFileMap
  }

  // --- language features

  private static clearFiles(tsDiagnostics: typescript.Diagnostic[]): Diagnostic[] {
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
    return BaseTypeScriptWorker.clearFiles(diagnostics)
  }

  async getSemanticDiagnostics(fileName: string): Promise<Diagnostic[]> {
    if (fileNameIsLib(fileName)) {
      return []
    }
    const diagnostics = this._languageService.getSemanticDiagnostics(fileName)
    return BaseTypeScriptWorker.clearFiles(diagnostics)
  }

  async getSuggestionDiagnostics(fileName: string): Promise<Diagnostic[]> {
    if (fileNameIsLib(fileName)) {
      return []
    }
    const diagnostics = this._languageService.getSuggestionDiagnostics(fileName)
    return BaseTypeScriptWorker.clearFiles(diagnostics)
  }

  async getCompilerOptionsDiagnostics(fileName: string): Promise<Diagnostic[]> {
    if (fileNameIsLib(fileName)) {
      return []
    }
    const diagnostics = this._languageService.getCompilerOptionsDiagnostics()
    return BaseTypeScriptWorker.clearFiles(diagnostics)
  }

  getTypeChecker() {
    return this._languageService.getProgram()!.getTypeChecker() as TypeChecker
  }

  getSourceFile(fileName: string) {
    const program = this._languageService.getProgram()
    return program?.getSourceFile(fileName)
  }

  getTokenAtPosition(fileName: string, position: number) {
    const program = this._languageService.getProgram()
    const sourceFile = program?.getSourceFile(fileName)
    if (!sourceFile) {
      console.error('Missing source file', fileName)
      return
    }
    return typescript.getTokenAtPosition(sourceFile, position)
  }

  getParentTokenAtPosition(fileName: string, position: number): typescript.JsxOpeningLikeElement | undefined {
    const token = this.getTokenAtPosition(fileName, position)
    const parent = token?.parent
    if (parent && typescript.isJsxOpeningLikeElement(parent)) {
      return parent
    }
  }

  async getCompletionsAtPosition(
    fileName: string,
    position: number
  ): Promise<typescript.CompletionInfo | undefined> {
    if (fileNameIsLib(fileName)) {
      return undefined
    }

    return this._languageService.getCompletionsAtPosition(fileName, position, undefined)
  }

  async getCompletionEntryDetails(
    fileName: string,
    position: number,
    entry: string
  ): Promise<typescript.CompletionEntryDetails | undefined> {
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
    options: typescript.SignatureHelpItemsOptions | undefined
  ): Promise<typescript.SignatureHelpItems | undefined> {
    if (fileNameIsLib(fileName)) {
      return undefined
    }
    return this._languageService.getSignatureHelpItems(fileName, position, options)
  }

  async getQuickInfoAtPosition(
    fileName: string,
    position: number
  ): Promise<typescript.QuickInfo | undefined> {
    if (fileNameIsLib(fileName)) {
      return undefined
    }
    return this._languageService.getQuickInfoAtPosition(fileName, position)
  }

  async getOccurrencesAtPosition(
    fileName: string,
    position: number
  ): Promise<ReadonlyArray<typescript.ReferenceEntry> | undefined> {
    if (fileNameIsLib(fileName)) {
      return undefined
    }
    return this._languageService.getOccurrencesAtPosition(fileName, position)
  }

  async getDefinitionAtPosition(
    fileName: string,
    position: number
  ): Promise<ReadonlyArray<typescript.DefinitionInfo> | undefined> {
    if (fileNameIsLib(fileName)) {
      return undefined
    }
    return this._languageService.getDefinitionAtPosition(fileName, position)
  }

  async getReferencesAtPosition(
    fileName: string,
    position: number
  ): Promise<typescript.ReferenceEntry[] | undefined> {
    if (fileNameIsLib(fileName)) {
      return undefined
    }
    return this._languageService.getReferencesAtPosition(fileName, position)
  }

  async getNavigationBarItems(fileName: string): Promise<typescript.NavigationBarItem[]> {
    if (fileNameIsLib(fileName)) {
      return []
    }
    return this._languageService.getNavigationBarItems(fileName)
  }

  async getFormattingEditsForDocument(
    fileName: string,
    options: typescript.FormatCodeOptions
  ): Promise<typescript.TextChange[]> {
    if (fileNameIsLib(fileName)) {
      return []
    }
    return this._languageService.getFormattingEditsForDocument(fileName, options)
  }

  async getFormattingEditsForRange(
    fileName: string,
    start: number,
    end: number,
    options: typescript.FormatCodeOptions
  ): Promise<typescript.TextChange[]> {
    if (fileNameIsLib(fileName)) {
      return []
    }
    return this._languageService.getFormattingEditsForRange(fileName, start, end, options)
  }

  async getFormattingEditsAfterKeystroke(
    fileName: string,
    postion: number,
    ch: string,
    options: typescript.FormatCodeOptions
  ): Promise<typescript.TextChange[]> {
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
  ): Promise<readonly typescript.RenameLocation[] | undefined> {
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
    options: typescript.RenameInfoOptions
  ): Promise<typescript.RenameInfo> {
    if (fileNameIsLib(fileName)) {
      return { canRename: false, localizedErrorMessage: 'Cannot rename in lib file' }
    }
    return this._languageService.getRenameInfo(fileName, position, options)
  }

  async getEmitOutput(fileName: string): Promise<typescript.EmitOutput> {
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
    formatOptions: typescript.FormatCodeOptions
  ): Promise<ReadonlyArray<typescript.CodeFixAction>> {
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

  async provideInlayHints(
    fileName: string,
    start: number,
    end: number
  ): Promise<readonly typescript.InlayHint[]> {
    if (fileNameIsLib(fileName)) {
      return []
    }
    const preferences: typescript.UserPreferences = this._inlayHintsOptions ?? {}
    const span: typescript.TextSpan = {
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
