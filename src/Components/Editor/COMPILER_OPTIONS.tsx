// import * as ts from 'typescript/built/local/typescript'

// console.log(ts, ts.JsxEmit)
import { JsxEmit, ModuleKind, ModuleResolutionKind, ScriptTarget } from 'typescript'
import { defaults } from 'lodash-es'
import { languages } from 'monaco-editor/esm/vs/editor/editor.api'
type CompilerOptions = languages.typescript.CompilerOptions
// const { JsxEmit, ModuleKind, ModuleResolutionKind, ScriptTarget } = ts

export const COMPILER_OPTIONS: CompilerOptions = defaults({
  allowJs: false,
  allowSyntheticDefaultImports: true,
  allowNonTsExtensions: true,
  alwaysStrict: true,
  esModuleInterop: false,
  forceConsistentCasingInFileNames: false,
  isolatedModules: false,
  jsx: JsxEmit.Preserve,
  module: ModuleKind.ESNext,
  moduleResolution: ModuleResolutionKind.NodeJs,
  // noEmit: false,
  noEmit: true,
  resolveJsonModule: false,
  strict: true,
  skipLibCheck: true,
  // noLib: true,
  target: ScriptTarget.ESNext,
  lib: ['dom', 'dom.iterable', 'esnext'].map((lib) => 'lib.' + lib + '.d.ts'),
  // rootDir: '../',
  // skipDefaultLibCheck: false,
} as CompilerOptions)
