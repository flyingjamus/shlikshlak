/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { languages } from 'monaco-editor'
import TypeScriptWorker = languages.typescript.TypeScriptWorker

export class AppTypeScriptWorker implements TypeScriptWorker {
  findRenameLocations(fileName: string, positon: number, findInStrings: boolean, findInComments: boolean, providePrefixAndSuffixTextForRename: boolean): Promise<readonly any[] | undefined> {
    return Promise.resolve(undefined)
  }

  getCodeFixesAtPosition(fileName: string, start: number, end: number, errorCodes: number[], formatOptions: any): Promise<ReadonlyArray<any>> {
    return Promise.resolve(undefined)
  }

  getCompilerOptionsDiagnostics(fileName: string): Promise<languages.typescript.Diagnostic[]> {
    return Promise.resolve([])
  }

  getCompletionEntryDetails(fileName: string, position: number, entry: string): Promise<any> {
    return Promise.resolve(undefined)
  }

  getCompletionsAtPosition(fileName: string, position: number): Promise<any> {
    return Promise.resolve(undefined)
  }

  getDefinitionAtPosition(fileName: string, position: number): Promise<ReadonlyArray<any> | undefined> {
    return Promise.resolve(undefined)
  }

  getEmitOutput(fileName: string): Promise<languages.typescript.EmitOutput> {
    return Promise.resolve(undefined)
  }

  getFormattingEditsAfterKeystroke(fileName: string, postion: number, ch: string, options: any): Promise<any[]> {
    return Promise.resolve([])
  }

  getFormattingEditsForDocument(fileName: string, options: any): Promise<any[]> {
    return Promise.resolve([])
  }

  getFormattingEditsForRange(fileName: string, start: number, end: number, options: any): Promise<any[]> {
    return Promise.resolve([])
  }

  getNavigationBarItems(fileName: string): Promise<any[]> {
    return Promise.resolve([])
  }

  getOccurrencesAtPosition(fileName: string, position: number): Promise<ReadonlyArray<any> | undefined> {
    return Promise.resolve(undefined)
  }

  getQuickInfoAtPosition(fileName: string, position: number): Promise<any> {
    return Promise.resolve(undefined)
  }

  getReferencesAtPosition(fileName: string, position: number): Promise<any[] | undefined> {
    return Promise.resolve(undefined)
  }

  getRenameInfo(fileName: string, positon: number, options: any): Promise<any> {
    return Promise.resolve(undefined)
  }

  getScriptText(fileName: string): Promise<string | undefined> {
    return Promise.resolve(undefined)
  }

  getSemanticDiagnostics(fileName: string): Promise<languages.typescript.Diagnostic[]> {
    return Promise.resolve([])
  }

  getSignatureHelpItems(fileName: string, position: number, options: any): Promise<any> {
    return Promise.resolve(undefined)
  }

  getSuggestionDiagnostics(fileName: string): Promise<languages.typescript.Diagnostic[]> {
    return Promise.resolve([])
  }

  getSyntacticDiagnostics(fileName: string): Promise<languages.typescript.Diagnostic[]> {
    return Promise.resolve([])
  }

  provideInlayHints(fileName: string, start: number, end: number): Promise<ReadonlyArray<any>> {
    return Promise.resolve([])
  }

}
