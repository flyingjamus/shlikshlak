import React, { useEffect, useRef, useState } from 'react'
import { Box } from '@mui/material'
import * as monaco from 'monaco-editor'
import { editor } from 'monaco-editor'
import { useFileStore } from '../store'
// @ts-ignore
import { initVimMode } from 'monaco-vim'
import { defaults } from 'lodash-es'
import { useTypingWorker } from './UseTypingWorker'
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor
import libEsnext from 'typescript/lib/lib.esnext.d.ts?raw'
import lub from 'typescript/lib/lib.d.ts?raw'

// const useTv

const bindEditor = (editor: IStandaloneCodeEditor) => {
  const editorService = editor._codeEditorService
  const openEditorBase = editorService.openCodeEditor.bind(editorService)
  editorService.openCodeEditor = async (input, source) => {
    const result = await openEditorBase(input, source)
    if (result === null) {
      alert('intercepted')
      console.log('Open definition for:', input)
      console.log('Corresponding model:', monaco.editor.getModel(input.resource))
      console.log('Source: ', source)
      source.setModel(monaco.editor.getModel(input.resource))
    }
    return result // always return the base result
  }
}

export const MonacoEditor = () => {
  // const monaco: Monaco | null = useMonaco()
  const [monacoInstance, setMonacoInstance] = useState<IStandaloneCodeEditor>()
  const files = useFileStore((v) => v.files)
  const allFiles = useFileStore((v) => v.allFiles)

  const ref = useRef<HTMLDivElement>()
  const statusBarRef = useRef<HTMLDivElement>()
  useEffect(() => {
    const el = ref.current
    if (!el) throw new Error('Missing ref')
    if (monacoInstance) {
      return
    }

    monaco.languages.onLanguage('typescript', () => {})

    const editor = monaco.editor.create(el, MONACO_OPTIONS)
    const vimMode = initVimMode(editor, statusBarRef.current)

    bindEditor(editor)
    setMonacoInstance(editor)

    return () => {
      // setMonacoInstance(undefined)
      // editor.dispose()
    }
  }, [monacoInstance])

  useEffect(() => {
    if (monaco && files) {
      const editor = monaco.editor
      const models = editor.getModels()

      // console.log('MODELS', models)
      const fileNames = Object.keys(files)
      models.forEach((model) => {
        if (!fileNames.includes(model.uri.path)) {
          // console.log('Removing', model.uri)
          model.dispose()
        }
      })
      for (const file of Object.values(files)) {
        const uri = monaco.Uri.file(file.path.slice(1))
        if (file.path.includes('1.tsx')) {
          // console.log('Creating', file, uri)
          const existing = editor.getModel(uri)
          if (existing) {
            existing.setValue(file.code)
          } else {
            const newModel = editor.createModel(file.code, undefined, uri)
          }
        } else {
          // monaco.languages.typescript.typescriptDefaults.addExtraLib(file.code, uri.toString())
        }
      }
      // ;(async () => {
      //   const worker = await monaco.languages.typescript.getTypeScriptWorker()
      //   const uri = monaco.Uri.file('1/1.tsx')
      //   const client = await worker(uri)
      //   console.log(7777, client)
      //   console.log(55555, await client.preProcessFile('file:///1/1.tsx'))
      // })()

      // // monaco.editor.op
      // // editor.setMod
      // return () => {}
    }
  }, [monacoInstance, files])
  const openFile = useFileStore((v) => v.openFile)
  useEffect(() => {
    if (openFile) {
      const model = editor.getModel(monaco.Uri.file(openFile))
      if (monacoInstance?.getModel() !== model) {
        console.log('Setting model', model)
        monacoInstance?.setModel(model)
      }
    }
  }, [openFile])

  // useTypingWorker()

  // const [editor, setEditor] = useState<IStandaloneCodeEditor>()
  // useEffect(() => {
  //   if (editor) {
  //     window.require.config({
  //       paths: {
  //         'monaco-vim': 'https://unpkg.com/monaco-vim/dist/monaco-vim',
  //       },
  //     })
  //
  //     let result: any
  //     // TODO you know
  //     window.require(['monaco-vim'], function (MonacoVim) {
  //       const statusNode = document.querySelector('.status-node')
  //       result = MonacoVim.initVimMode(editor, statusNode)
  //     })
  //     // const vimMode = initVimMode(editor, statusBarRef.current)
  //     return () => {
  //       result?.dispose()
  //     }
  //   }
  // }, [editor])
  return (
    <>
      <Box ref={ref} sx={{ height: '100%' }} />
      {/*<MonacoEditor*/}
      {/*  defaultLanguage="typescript"*/}
      {/*  beforeMount={async (monaco) => {*/}
      {/*    monaco.languages.typescript.typescriptDefaults.setCompilerOptions(COMPILER_OPTIONS)*/}
      {/*    monaco.languages.typescript.javascriptDefaults.setCompilerOptions(COMPILER_OPTIONS)*/}
      {/*  }}*/}
      {/*  defaultValue={''}*/}
      {/*  options={MONACO_OPTIONS}*/}
      {/*  defaultPath={'/1.tsx'}*/}
      {/*  onValidate={(markers) => {}}*/}
      {/*  {...props}*/}
      {/*/>*/}
      <Box ref={statusBarRef} />
    </>
  )
}

// const COMPILER_OPTIONS = {
//   allowJs: true,
//   allowSyntheticDefaultImports: true,
//   alwaysStrict: true,
//   esModuleInterop: true,
//   forceConsistentCasingInFileNames: true,
//   isolatedModules: true,
//   // jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
//   jsx: monaco.languages.typescript.JsxEmit.Preserve,
//   module: monaco.languages.typescript.ModuleKind.ESNext,
//   moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
//   noEmit: true,
//   resolveJsonModule: true,
//   strict: true,
//   target: monaco.languages.typescript.ScriptTarget.ESNext,
//   // paths: {
//   //   '*': ['*', '*.native', '*.ios', '*.android'],
//   // },
// }
window.monaco = monaco

// monaco.languages.typescript.getTypeScriptWorker().then((worker) => {
//   worker(monaco.Uri.file('/1/1.tsx')).then(function (proxy) {
//     console.log(7777,proxy )
//   })
// })

const COMPILER_OPTIONS: monaco.languages.typescript.CompilerOptions = defaults(
  {
    allowJs: true,
    allowSyntheticDefaultImports: true,
    allowNonTsExtensions: true,
    alwaysStrict: true,
    esModuleInterop: true,
    forceConsistentCasingInFileNames: true,
    isolatedModules: true,
    jsx: monaco.languages.typescript.JsxEmit.Preserve,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    // noEmit: false,
    noEmit: true,
    resolveJsonModule: true,
    strict: true,
    skipLibCheck: false,
    // noLib: true,
    target: monaco.languages.typescript.ScriptTarget.ESNext,
    lib: ['dom', 'dom.iterable', 'esnext'],
  } as monaco.languages.typescript.CompilerOptions,
  monaco.languages.typescript.typescriptDefaults.getCompilerOptions()
)
// monaco.languages.typescript.typescriptDefaults.setWorkerOptions({ customWorkerPath: '../' })
monaco.languages.typescript.typescriptDefaults.setCompilerOptions(COMPILER_OPTIONS)
monaco.languages.typescript.javascriptDefaults.setCompilerOptions(COMPILER_OPTIONS)
monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true)
monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true)
// monaco.languages.typescript.typescriptDefaults.setEagerModelSync(false);
// monaco.languages.typescript.javascriptDefaults.setEagerModelSync(false);
// monaco.languages.typescript.typescriptDefaults.addExtraLib(libEsnext, 'defaultLib:lib.es6.d.ts')
// monaco.languages.typescript.typescriptDefaults.addExtraLib(lub, 'defaultLib:lib.d.ts')

const MONACO_OPTIONS: monaco.editor.IStandaloneEditorConstructionOptions = {
  acceptSuggestionOnCommitCharacter: true,
  acceptSuggestionOnEnter: 'on',
  accessibilitySupport: 'auto',
  autoIndent: 'full',
  automaticLayout: true,
  codeLens: true,
  colorDecorators: true,
  contextmenu: true,
  cursorBlinking: 'blink',
  cursorSmoothCaretAnimation: false,
  cursorStyle: 'line',
  disableLayerHinting: false,
  disableMonospaceOptimizations: false,
  dragAndDrop: false,
  fixedOverflowWidgets: false,
  folding: true,
  foldingStrategy: 'auto',
  fontLigatures: false,
  formatOnPaste: false,
  formatOnType: false,
  hideCursorInOverviewRuler: false,
  links: true,
  mouseWheelZoom: false,
  multiCursorMergeOverlapping: true,
  multiCursorModifier: 'alt',
  overviewRulerBorder: true,
  overviewRulerLanes: 2,
  quickSuggestions: true,
  quickSuggestionsDelay: 100,
  readOnly: false,
  renderControlCharacters: false,
  renderFinalNewline: true,
  // renderIndentGuides: true,
  renderLineHighlight: 'all',
  renderWhitespace: 'none',
  revealHorizontalRightPadding: 30,
  roundedSelection: true,
  rulers: [],
  scrollBeyondLastColumn: 5,
  scrollBeyondLastLine: true,
  selectOnLineNumbers: true,
  selectionClipboard: true,
  selectionHighlight: true,
  showFoldingControls: 'mouseover',
  smoothScrolling: false,
  suggestOnTriggerCharacters: true,
  wordBasedSuggestions: true,
  // eslint-disable-next-line
  wordSeparators: `~!@#$%^&*()-=+[{]}\|;:'",.<>/?`,
  wordWrap: 'off',
  wordWrapBreakAfterCharacters: '\t})]?|&,;',
  wordWrapBreakBeforeCharacters: '{([+',
  // wordWrapBreakObtrusiveCharacters: '.',
  wordWrapColumn: 80,
  wordWrapMinified: true,
  wrappingIndent: 'none',
  suggest: {
    showSnippets: false,
    showWords: false,
    showKeywords: false,
  },
}
// const get

export default MonacoEditor
