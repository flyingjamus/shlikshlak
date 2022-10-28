import React, { useEffect, useRef, useState } from 'react'
import { Box } from '@mui/material'
import * as monaco from 'monaco-editor'
import { editor } from 'monaco-editor'
import { useFileStore, useIframeStore } from '../store'
// @ts-ignore
import { initVimMode } from 'monaco-vim'
import { getFileText } from '../../tsworker/fileGetter'
import { COMPILER_OPTIONS } from './COMPILER_OPTIONS'
import { getTypescriptWorker } from '../../tsworker/GetTypescriptWorker'
import { throttle } from 'lodash-es'
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor

// const useTv

// const bindEditor = (editor: IStandaloneCodeEditor) => {
//   const editorService = editor._codeEditorService
//   const openEditorBase = editorService.openCodeEditor.bind(editorService)
//   editorService.openCodeEditor = async (input, source) => {
//     const result = await openEditorBase(input, source)
//     if (result === null) {
//       alert('intercepted')
//       console.log('Open definition for:', input)
//       console.log('Corresponding model:', monaco.editor.getModel(input.resource))
//       console.log('Source: ', source)
//       source.setModel(monaco.editor.getModel(input.resource))
//     }
//     return result // always return the base result
//   }
// }

export const MonacoEditor = () => {
  // const monaco: Monaco | null = useMonaco()
  const [monacoInstance, setMonacoInstance] = useState<IStandaloneCodeEditor>()
  const files = useFileStore((v) => v.files)

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
    monaco.editor.onDidCreateEditor((codeEditor) => {
      // console.log(312312321, codeEditor)
    })

    editor.onDidChangeModelContent(async (e) => {
      console.log('Onchange', e)
      const worker = await getTypescriptWorker()
      const model = editor.getModel()

      await fetch('http://localhost:3001', {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ body: model?.getValue(), path: model?.uri.path }),
        method: 'POST',
      })
      const pos = editor.getPosition()
      if (model && pos) {
        const offset = model.getOffsetAt(pos)
        const panels = await worker.getPanelsAtPosition(model.uri.toString(), offset)
        useIframeStore.setState({ panels: panels })
      }
    })
    const listener = editor.onDidChangeCursorPosition(
      throttle(
        (e) => {
          const openFile = useIframeStore.getState().openFile
          if (openFile) {
            useIframeStore.setState({
              openFile: {
                ...openFile,
                lineNumber: e.position.lineNumber,
                columnNumber: e.position.column,
              },
            })
          }
        },
        50,
        { trailing: true, leading: false }
      )
    )

    // bindEditor(editor)
    setMonacoInstance(editor)

    return () => {
      // listener.dispose()
      // setMonacoInstance(undefined)
      // editor.dispose()
    }
  }, [monacoInstance])

  const openFile = useIframeStore((v) => v.openFile)
  const [delay, setDelay] = useState({})
  useEffect(() => {
    ;(async () => {
      if (openFile) {
        const path = openFile.path
        if (path) {
          const uri = monaco.Uri.file(path)
          const fileCode = files?.[path]?.code || getFileText(path)
          const model = editor.getModel(uri) || (fileCode && editor.createModel(fileCode, undefined, uri))
          if (monacoInstance && model) {
            try {
              const worker = await getTypescriptWorker()
              const uriString = uri.toString()
              const offset = model.getOffsetAt({
                column: +openFile.columnNumber,
                lineNumber: +openFile.lineNumber,
              })
              const panels = await worker.getPanelsAtPosition(uriString, offset)
              useIframeStore.setState({ panels: panels })
            } catch (e) {
              console.log(e)
              setTimeout(() => {
                setDelay({})
              }, 500)
            }
            if (monacoInstance?.getModel() !== model) {
              monacoInstance.setModel(model)
              monacoInstance?.revealLineInCenter(+openFile.lineNumber)
            } else {
              monacoInstance?.revealLineInCenter(+openFile.lineNumber)
            }
            monacoInstance?.setPosition({ lineNumber: +openFile.lineNumber, column: +openFile.columnNumber })
            monacoInstance.focus()
          }
        }
      }
    })()
  }, [openFile, delay, files, monacoInstance])

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
  // wordWrapMinified: true,
  wrappingIndent: 'none',
  suggest: {
    showSnippets: false,
    showWords: false,
    showKeywords: false,
  },
}
// const get

monaco.languages.typescript.typescriptDefaults.setCompilerOptions(COMPILER_OPTIONS)
monaco.languages.typescript.javascriptDefaults.setCompilerOptions(COMPILER_OPTIONS)
monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true)
monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true)

export default MonacoEditor
