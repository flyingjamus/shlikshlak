import ts from 'typescript'
// import ts from 'typescript/built/local/typescript.js'
// import { JsxEmit, ModuleKind, ModuleResolutionKind, ScriptTarget, CompilerOptions } from 'typescript'

export const COMPILER_OPTIONS: ts.CompilerOptions = {
  allowJs: false,
  allowSyntheticDefaultImports: true,
  allowNonTsExtensions: true,
  alwaysStrict: true,
  esModuleInterop: false,
  forceConsistentCasingInFileNames: false,
  isolatedModules: true,
  jsx: ts.JsxEmit.Preserve,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.NodeJs,
  // noEmit: false,
  noEmit: true,
  resolveJsonModule: false,
  strict: true,
  skipLibCheck: false,
  // noLib: true,
  target: ts.ScriptTarget.ESNext,
  lib: ['dom', 'dom.iterable', 'esnext'],
  // skipDefaultLibCheck: false,
} as ts.CompilerOptions
// const filename = 'src/Components/Inspector/InspectorTree.tsx'
const filename = '1/1.tsx'

class LanguageServiceHost implements ts.LanguageServiceHost {
  private _compileOptions: ts.CompilerOptions
  private _versions: Map<string, number> = new Map()
  private _snapshots: Map<string, ts.IScriptSnapshot> = new Map()
  private _fileNames: Set<string> = new Set()
  private _cwd: string

  constructor(options: ts.CompilerOptions, cwd: string) {
    this._compileOptions = options
    this._cwd = cwd
    this._fileNames.add(filename)
  }

  getCompilationSettings() {
    return this._compileOptions
  }

  getScriptFileNames() {
    return [...this._fileNames.values()]
  }

  getScriptVersion(fileName: string) {
    return (this._versions.get(fileName) || 0).toString()
  }

  setScriptSnapshot(fileName: string, code: string) {
    this._fileNames.add(fileName)
    const version = (this._versions.get(fileName) || 0) + 1
    this._versions.set(fileName, version)
    const snapshot = ts.ScriptSnapshot.fromString(code)
    this._snapshots.set(fileName, snapshot)
  }

  getScriptSnapshot(fileName: string) {
    if (this._snapshots.has(fileName)) {
      return this._snapshots.get(fileName)
    }
    const code = ts.sys.readFile(fileName)
    if (code !== undefined) {
      this.setScriptSnapshot(fileName, code)
      return this._snapshots.get(fileName)
    }
  }

  getCurrentDirectory() {
    return this._cwd
  }

  getDefaultLibFileName(opts: ts.CompilerOptions) {
    return ts.getDefaultLibFilePath(opts)
  }

  fileExists(path: string) {
    return ts.sys.fileExists(path)
  }

  readFile(path: string, encoding?: string) {
    return ts.sys.readFile(path, encoding)
  }

  readDirectory(path: string, extensions?: string[], exclude?: string[], include?: string[], depth?: number) {
    return ts.sys.readDirectory(path, extensions, exclude, include, depth)
  }

  directoryExists(dirName: string) {
    return ts.sys.directoryExists(dirName)
  }

  getDirectories(dirName: string) {
    return ts.sys.getDirectories(dirName)
  }
}

const ls = ts.createLanguageService(new LanguageServiceHost(COMPILER_OPTIONS, ''))
const sourceFile = ls.getProgram()?.getSourceFile(filename)
if (sourceFile) {
  const pos = sourceFile.getPositionOfLineAndCharacter(11, 24)
  console.time('get')
  // console.profile('get')
  const completions = ls.getCompletionsAtPosition(filename, pos, {})
  // console.profileEnd('get')
  // console.profile('get2')
  ls.getCompletionsAtPosition(filename, pos, {})
  ls.getCompletionsAtPosition(filename, pos, {})
  ls.getCompletionsAtPosition(filename, pos, {})
  console.timeEnd('get')
  // console.profileEnd('get2')
  console.log(completions?.entries.map((v) => v.name))
}
