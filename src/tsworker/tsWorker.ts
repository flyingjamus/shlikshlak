import * as ts from '../lib/typescriptServices'
import * as edworker from 'monaco-editor-core/esm/vs/editor/editor.worker'
import { libFileMap } from '../lib/lib'
import {
  Diagnostic,
  DiagnosticRelatedInformation,
  IExtraLibs,
  TypeScriptWorker as ITypeScriptWorker,
} from './monaco.contribution'
import type { Uri, worker } from 'monaco-editor-core/esm/vs/editor/editor.api'
import { fillCacheFromStore, getFile } from './fileGetter'
import { expose } from 'comlink'
import type * as tstype from 'typescript'
import type { DocumentRegistry } from 'typescript'
import { FileSystemHost, RuntimeDirEntry } from 'ts-morph'
import { parse, stringify } from 'flatted'
import { PanelMatch, PanelsResponse } from '../Shared/PanelTypes'
import { isDefined } from 'ts-is-defined'

// export {
//   Uri,
//   type worker,
//   libFileMap,
//   ts,
//   type Diagnostic,
//   type DiagnosticRelatedInformation,
//   type IExtraLibs,
//   type TypeScriptWorker as ITypeScriptWorker,
// }

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

// const proxy = <T extends any>(o: T, v: keyof T) => {
//   const old = o[v]
//   o[v] = function (...args: unknown[]) {
//     console.log(`Called ${v} with `, args.length > 1 ? args : args[0])
//     const res = old.apply(this, args)
//     console.log(`Got ${v} with `, res)
//     return res
//   }
// }
// proxy(documentRegistry, 'acquireDocument')
// proxy(documentRegistry, 'acquireDocumentWithKey')
// console.log(documentRegistry)
// documentRegistry.updateDocument =

export const PANELS: { matcher: (type: ts.Type, checker: TypeChecker) => PanelMatch | undefined }[] = [
  {
    matcher: (type: ts.Type, checker: TypeChecker) => {
      if (checker.isTypeAssignableTo(checker.getBooleanType(), type)) {
        return { name: 'boolean' }
      }
    },
  },
  {
    matcher: (type, checker) => {
      if (type.isUnionOrIntersection()) {
        const values = type.types
          .map((v) => {
            if (v.isStringLiteral()) {
              return v.value
            }
          })
          .filter(isDefined)
        if (values.length) {
          values.sort()
          return {
            name: 'enum',
            parameters: { values },
          }
        }
      }
    },
  },
  {
    matcher: (type: ts.Type, checker: TypeChecker) => {
      if (checker.isTypeAssignableTo(checker.getStringType(), type)) {
        return { name: 'string' }
      }
    },
  },
]

type TypeChecker = ts.TypeChecker & {
  isTypeAssignableTo: (source: ts.Type, target: ts.Type) => boolean
  getStringType: () => ts.Type
  getBooleanType: () => ts.Type
}

export class TypeScriptWorker implements ts.LanguageServiceHost, ITypeScriptWorker {
  // --- model sync -----------------------

  private _ctx: worker.IWorkerContext
  private _extraLibs: IExtraLibs = Object.create(null)
  private _compilerOptions: ts.CompilerOptions
  private _inlayHintsOptions?: ts.UserPreferences

  private _languageService = ts.createLanguageService(this, documentRegistry)

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
    return ''
  }

  async getScriptText(fileName: string): Promise<string | undefined> {
    return this._getScriptText(fileName)
  }

  _getScriptText(fileName: string): string | undefined {
    let text: string
    const model = this._getModel(fileName)
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

  getTypeChecker() {
    return this._languageService.getProgram()!.getTypeChecker() as TypeChecker
  }

  async setAttributeAtPosition(
    fileName: string,
    position: number,
    attr: string,
    value?: string
  ): Promise<ts.TextChange[] | void> {
    const parent = this.getParentTokenAtPosition(fileName, position)
    if (parent) {
      const existing = parent.attributes.properties.find(
        (v) => typescript.isJsxAttribute(v) && v.name.escapedText.toString() === attr
      ) as ts.JsxAttribute | undefined
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

  getParentTokenAtPosition(fileName: string, position: number): ts.JsxOpeningLikeElement | undefined {
    console.log('getParentTokenAtPosition', fileName, position)
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

    // const wrappedNode = createWrappedNode(token, {
    //   compilerOptions: program.getCompilerOptions(),
    //   sourceFile: sourceFile,
    //   typeChecker: program.getTypeChecker(),
    // })
    // const wrappedSourceFile = createWrappedNode(sourceFile, {
    //   compilerOptions: program.getCompilerOptions(),
    //   sourceFile: sourceFile,
    //   typeChecker: program.getTypeChecker(),
    // })
    // wrappedSourceFile.applyTextChanges(changes)
    // // console.log(wrappedSourceFile.print())
    // // wrappedNode._project = this._languageService
  }

  async getCompletionsAtPosition(fileName: string, position: number): Promise<ts.CompletionInfo | undefined> {
    console.log(fileName, position)
    if (fileNameIsLib(fileName)) {
      return undefined
    }

    const program = this._languageService.getProgram()!

    const sourceFile = program.getSourceFile(fileName)
    const checker = program.getTypeChecker()

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
    return this.tsWorker.fileExists(fixPath(filePath))
  }

  fileExistsSync(filePath: string): boolean {
    return this.tsWorker.fileExists(fixPath(filePath))
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
    return this.tsWorker.readFile(fixPath(filePath)) || '' //TODO?
  }

  readFileSync(filePath: string, encoding?: string): string {
    return this.tsWorker.readFile(fixPath(filePath)) || '' //TODO?
  }

  realpathSync(path: string): string {
    return ''
  }

  writeFile(filePath: string, fileText: string): Promise<void> {
    return Promise.resolve(undefined)
  }

  writeFileSync(filePath: string, fileText: string): void {}
}

const fixPath = (path: string) => {
  return 'file:///' + path.slice('file:/'.length)
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
