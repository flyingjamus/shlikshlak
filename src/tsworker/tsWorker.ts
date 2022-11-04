import type { DocumentRegistry, LanguageService } from 'typescript'
import * as typescript from 'typescript'
import * as edworker from 'monaco-editor-core/esm/vs/editor/editor.worker'
import { libFileMap } from '../lib/lib'
import {
  Diagnostic,
  DiagnosticRelatedInformation,
  IExtraLibs,
  TypeScriptWorker as ITypeScriptWorker,
} from './monaco.contribution'
import type { Uri, worker } from 'monaco-editor-core/esm/vs/editor/editor.api'
import { AppFile, fileExists, fillCacheFromStore, getFile, getFileVersion } from './fileGetter'
import { expose } from 'comlink'
import { parse, stringify } from 'flatted'
import { PanelsResponse } from '../Shared/PanelTypes'
import { isDefined } from 'ts-is-defined'
import { Project } from 'ts-morph'
import { COMPILER_OPTIONS } from '../Components/Editor/COMPILER_OPTIONS'
import { MyFileSystemHost } from './MyFileSystemHost'
import { PANELS, TypeChecker } from './Panels'
import { isFunction } from 'lodash-es'

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

const documentRegistry: DocumentRegistry = typescript.createDocumentRegistry()

// const documentRegistry: DocumentRegistry = (ts as any).typescript.createDocumentRegistryInternal(true, '', {
//   setDocument: (key: string, path: ts.Path, sourceFile: ts.SourceFile) => {
//     const KEY =
//       '99|99|true|1|true|undefined|2|undefined|undefined|undefined|undefined|undefined|undefined|true|undefined|undefined|undefined|true|undefined|undefinedundefined'
//     const PATH = 'lib.esnext.intl.d.ts'
//     const S =
//       '[{"pos":0,"end":1194,"flags":16777216,"modifierFlagsCache":0,"transformFlags":1,"kind":305,"statements":"1","endOfFileToken":"2","fileName":"3","text":"4","languageVersion":99,"languageVariant":0,"scriptKind":3,"isDeclarationFile":true,"hasNoDefaultLib":true,"bindDiagnostics":"5","pragmas":"6","referencedFiles":"7","typeReferenceDirectives":"8","libReferenceDirectives":"9","amdDependencies":"10","nodeCount":52,"identifierCount":14,"identifiers":"11","parseDiagnostics":"12","version":"13","scriptSnapshot":"14"},[null],{"pos":1193,"end":1194,"flags":16777216,"modifierFlagsCache":0,"transformFlags":0,"kind":1},"lib.esnext.intl.d.ts","/*! *****************************************************************************\\nCopyright (c) Microsoft Corporation. All rights reserved.\\nLicensed under the Apache License, Version 2.0 (the \\"License\\"); you may not use\\nthis file except in compliance with the License. You may obtain a copy of the\\nLicense at http://www.apache.org/licenses/LICENSE-2.0\\n\\nTHIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY\\nKIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED\\nWARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,\\nMERCHANTABLITY OR NON-INFRINGEMENT.\\n\\nSee the Apache Version 2.0 License for specific language governing permissions\\nand limitations under the License.\\n***************************************************************************** */\\n\\n\\n\\n/// <reference no-default-lib=\\"true\\"/>\\n\\n\\ndeclare namespace Intl {\\n  interface NumberRangeFormatPart extends NumberFormatPart {\\n    source: \\"startRange\\" | \\"endRange\\" | \\"shared\\"\\n  }\\n\\n  interface NumberFormat {\\n    formatRange(start: number | bigint, end: number | bigint): string;\\n    formatRangeToParts(start: number | bigint, end: number | bigint): NumberRangeFormatPart[];\\n  }\\n}\\n",[],{},[],[],[],[],{},[],"",{}]\n'
//     if (key === KEY && path === PATH) {
//       const o = parse(S, (key: any, value: any) => {
//         // console.log(key, value)
//         return value
//       })
//       const s = stringify(
//         sourceFile,
//
//         // (k, v) => {
//         //   console.log(k,v)
//         //   return v
//         // }
//       )
//       console.log(sourceFile, s === S, parse(s))
//     }
//   },
//   getDocument: () => {},
// })

const proxy = <T extends any>(obj: T, key: keyof T, name = 'obj') => {
  const old = obj[key]
  if (!isFunction(old)) return
  obj[key] = function (...args: unknown[]) {
    console.log(`Called ${name}.${String(key)} with `, args.length > 1 ? args : args[0])
    const res = old.apply(this as any, args)
    console.log(`Got ${name}.${String(key)} with `, res)
    return res
  } as T[typeof key]
}

const proxyAll = (obj: any, name?: string) => {
  for (const key of Object.getOwnPropertyNames(obj)) {
    if (key === 'constructor') continue
    proxy(obj, key, name)
  }
  return obj
}

export class TypeScriptWorker implements typescript.LanguageServiceHost, ITypeScriptWorker {
  // --- model sync -----------------------

  project = new Project({
    // skipAddingFilesFromTsConfig: true,
    compilerOptions: COMPILER_OPTIONS,
    fileSystem: new MyFileSystemHost(this),
    // useInMemoryFileSystem: true
  })

  private _ctx: worker.IWorkerContext
  private _extraLibs: IExtraLibs = Object.create(null)
  private _compilerOptions: typescript.CompilerOptions
  private _inlayHintsOptions?: typescript.UserPreferences
  private _languageService = typescript.createLanguageService(this, documentRegistry)
  // private _languageService = this.project.getLanguageService().compilerObject

  constructor(ctx: worker.IWorkerContext, createData: ICreateData) {
    this._ctx = ctx
    this._compilerOptions = createData.compilerOptions
    this._extraLibs = createData.extraLibs
    this._inlayHintsOptions = createData.inlayHintsOptions
    // proxyAll('LANG', this._languageService)
    // const old = this._languageService.getProgram
    // this._languageService.getProgram = () => {
    //   const program = old.call(this)
    //   // proxyAll('PROGRAM', program)
    //   return program
    // }
    // console.log(this.project.addSourceFileAtPath('src/Components/Editor/MonacoEditor.tsx'))
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

  getTypeChecker() {
    return this._languageService.getProgram()!.getTypeChecker() as TypeChecker
  }

  async setAttributeAtPosition(
    fileName: string,
    position: number,
    attr: string,
    value?: string
  ): Promise<typescript.TextChange[] | void> {
    const parent = this.getParentTokenAtPosition(fileName, position)
    if (parent) {
      const existing = parent.attributes.properties.find(
        (v) => typescript.isJsxAttribute(v) && v.name.escapedText.toString() === attr
      ) as typescript.JsxAttribute | undefined
      if (existing?.initializer) {
        const initializer = existing.initializer
        const firstChar = initializer.getText().charAt(0)
        let quote = "'"
        if (firstChar === '{') {
          if (initializer.getText().charAt(1) === '"') {
            quote = '"'
          }
        } else if (firstChar === '"') {
          quote = '"'
        }
        if (value !== undefined) {
          const span = { start: initializer.pos, length: initializer.end - initializer.pos }
          if (value.includes(quote)) {
            return [
              {
                span: span,
                newText: `{${quote}${value.replaceAll(quote, '\\' + quote)}${quote}}`,
              },
            ]
          } else {
            return [
              {
                span: span,
                newText: quote + value + quote,
              },
            ]
          }
        }
      }
    }
  }

  getParentTokenAtPosition(fileName: string, position: number): typescript.JsxOpeningLikeElement | undefined {
    const program = this._languageService.getProgram()
    const sourceFile = program?.getSourceFile(fileName)
    if (!sourceFile) {
      console.error('Missing source file', fileName)
      return
    }
    const token = typescript.getTokenAtPosition(sourceFile, position)
    const parent = token.parent
    if (typescript.isJsxOpeningLikeElement(parent)) {
      return parent
    }
  }

  async getPanelsAtPosition(fileName: string, position: number): Promise<PanelsResponse> {
    const checker = this.getTypeChecker()
    const parent = this.getParentTokenAtPosition(fileName, position)
    if (parent) {
      const existingAttributes = parent.attributes.properties
        .map((attr) => {
          if (typescript.isJsxAttribute(attr)) {
            const initializerText = attr.initializer?.getText()
            let value
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
            return {
              name: attr.name.escapedText.toString(),
              value,
              hasInitializer: !!attr.initializer,
              location: {
                pos: attr.pos,
                end: attr.end,
              },
            }
          }
        })
        .filter(isDefined)
      const typeAtLocation = checker.getContextualType(parent.attributes)
      if (typeAtLocation) {
        const attributes = typeAtLocation.getProperties().map((prop) => {
          const type = checker.getNonNullableType(checker.getTypeOfSymbolAtLocation(prop, parent))
          return {
            name: prop.name,
            location: prop.valueDeclaration
              ? {
                  pos: prop.valueDeclaration?.pos,
                  end: prop.valueDeclaration?.end,
                }
              : undefined,
            panels: PANELS.map((v) => {
              return v.matcher(type, checker)
            }).filter(isDefined),
          }
        })

        return { attributes, existingAttributes, location: parent.pos, fileName }
      }
    }
    return { attributes: [], existingAttributes: [] }
  }

  async getCompletionsAtPosition(
    fileName: string,
    position: number
  ): Promise<typescript.CompletionInfo | undefined> {
    console.log(fileName, position)
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

export interface ICreateData {
  compilerOptions: typescript.CompilerOptions
  extraLibs: IExtraLibs
  customWorkerPath?: string
  inlayHintsOptions?: typescript.UserPreferences
}

/** The shape of the factory */
export interface CustomTSWebWorkerFactory {
  (
    TSWorkerClass: typeof TypeScriptWorker,
    tsc: typeof typescript,
    libs: Record<string, string>
  ): typeof TypeScriptWorker
}

// declare global {
// 	var importScripts: (path: string) => void | undefined;
// 	var customTSWorkerFactory: CustomTSWebWorkerFactory | undefined;
// }

export function create(ctx: worker.IWorkerContext, createData: ICreateData): TypeScriptWorker {
  console.log('Creating TS worker')
  const typeScriptWorker = new TypeScriptWorker(ctx, createData)
  // typeScriptWorker.init()
  return typeScriptWorker
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
globalThis.ts = typescript.typescript
