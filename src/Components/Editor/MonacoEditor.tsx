import React, { useEffect, useRef, useState } from 'react'
import { Box, IconButton } from '@mui/material'
import * as monaco from 'monaco-editor'
import { editor } from 'monaco-editor'
import { useFileStore, useIframeStore } from '../store'
import { getFileText } from '../../tsworker/fileGetter'
import { COMPILER_OPTIONS } from './COMPILER_OPTIONS'
import { throttle } from 'lodash-es'
import { apiClient } from '../../client/apiClient'
import { MONACO_OPTIONS } from './MONACO_OPTIONS'
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
// @ts-ignore
import { initVimMode } from 'monaco-vim'
import { WorkerAdapter } from '../../tsworker/workerAdapter'
import { getTypescriptWorker } from '../../tsworker/GetTypescriptWorker'

monaco.languages.onLanguage('typescript', async () => {
  useIframeStore.setState({ workerAdapter: new WorkerAdapter(await getTypescriptWorker()) })
})

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
      // console.log('Onchange', e)
      const worker = await getTypescriptWorker()
      const model = editor.getModel()
      if (!model) return

      await apiClient.writeFile({ contents: model?.getValue(), path: model?.uri.path })

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
  const workerAdapter = useIframeStore((v) => v.workerAdapter)
  const [delay, setDelay] = useState({})
  useEffect(() => {
    ;(async () => {
      if (openFile) {
        const path = openFile.path
        if (path) {
          const uri = monaco.Uri.file(path)
          const fileCode = files?.[path]?.code || (await getFileText(path))
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
              }, 200)
            }
            if (monacoInstance?.getModel() !== model) {
              monacoInstance.setModel(model)
              monacoInstance?.revealLineInCenter(+openFile.lineNumber)
            } else {
              monacoInstance.setModel(model)
              monacoInstance?.revealLineInCenter(+openFile.lineNumber)
            }
            // monacoInstance?.setPosition({ lineNumber: +openFile.lineNumber, column: +openFile.columnNumber })
            monacoInstance.focus()
          }
        }
      } else {
      }
    })()
  }, [openFile, delay, files, monacoInstance, workerAdapter])

  return (
    <Box sx={{ position: 'relative' }}>
      <Box ref={ref} sx={{ height: '100%' }} />
      <Box ref={statusBarRef} />
      {!openFile ? null : (
        <Box sx={{ position: 'absolute', top: '10px', right: '10px' }}>
          <IconButton
            onClick={async () => {
              await apiClient.launchEditor({
                fileName: openFile.path,
                lineNumber: openFile.lineNumber,
                colNumber: openFile.columnNumber,
              })
            }}
          >
            <OpenInNewIcon />
          </IconButton>
        </Box>
      )}
    </Box>
  )
}

// const get

monaco.languages.typescript.typescriptDefaults.setCompilerOptions(COMPILER_OPTIONS)
monaco.languages.typescript.javascriptDefaults.setCompilerOptions(COMPILER_OPTIONS)
monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true)
monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true)

export default MonacoEditor
