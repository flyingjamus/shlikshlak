import { JsxEmit, ModuleKind, ModuleResolutionKind, ScriptTarget } from 'typescript'
import { defaults } from 'lodash-es'
import { languages } from 'monaco-editor/esm/vs/editor/editor.api'
type CompilerOptions = languages.typescript.CompilerOptions

export const COMPILER_OPTIONS: CompilerOptions = defaults({
  allowJs: false,
  allowSyntheticDefaultImports: true,
  allowNonTsExtensions: true,
  alwaysStrict: true,
  esModuleInterop: false,
  forceConsistentCasingInFileNames: false,
  isolatedModules: true,
  jsx: JsxEmit.Preserve,
  module: ModuleKind.ESNext,
  moduleResolution: ModuleResolutionKind.NodeJs,
  // noEmit: false,
  noEmit: true,
  resolveJsonModule: false,
  strict: false,
  skipLibCheck: true,
  // noLib: true,
  target: ScriptTarget.ESNext,
  lib: ['dom', 'dom.iterable', 'esnext'],
} as CompilerOptions)
