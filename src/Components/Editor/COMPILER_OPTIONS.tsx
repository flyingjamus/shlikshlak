import { JsxEmit, ModuleKind, ModuleResolutionKind, ScriptTarget } from 'typescript'
import { defaults } from 'lodash-es'
import { languages } from 'monaco-editor/esm/vs/editor/editor.api'
type CompilerOptions = languages.typescript.CompilerOptions

export const COMPILER_OPTIONS: CompilerOptions = defaults({
  allowJs: true,
  allowSyntheticDefaultImports: true,
  allowNonTsExtensions: true,
  alwaysStrict: true,
  esModuleInterop: true,
  forceConsistentCasingInFileNames: true,
  isolatedModules: true,
  jsx: JsxEmit.Preserve,
  module: ModuleKind.ESNext,
  moduleResolution: ModuleResolutionKind.NodeJs,
  // noEmit: false,
  noEmit: true,
  resolveJsonModule: true,
  strict: true,
  skipLibCheck: false,
  // noLib: true,
  target: ScriptTarget.ESNext,
  lib: ['dom', 'dom.iterable', 'esnext'],
} as CompilerOptions)
