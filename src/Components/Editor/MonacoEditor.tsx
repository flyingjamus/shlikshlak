import React, { useEffect, useRef, useState } from 'react'
import { Box, IconButton } from '@mui/material'
import * as monaco from 'monaco-editor'
import { useFileStore, useIframeStore } from '../store'
import { getFileText } from '../../tsworker/fileGetter'
import { COMPILER_OPTIONS } from './COMPILER_OPTIONS'
import { apiClient } from '../../client/apiClient'
import { MONACO_OPTIONS } from './MONACO_OPTIONS'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
// @ts-ignore
import { initVimMode } from 'monaco-vim'
import { WorkerAdapter } from '../../tsworker/workerAdapter'
import { getTypescriptWorker } from '../../tsworker/GetTypescriptWorker'
import IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor

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
  const editor = useIframeStore((v) => v.editor)
  const files = useFileStore((v) => v.files)

  const ref = useRef<HTMLDivElement>()
  const statusBarRef = useRef<HTMLDivElement>()
  useEffect(() => {
    const el = ref.current
    if (!el) throw new Error('Missing ref')
    if (editor) {
      return
    }

    const instance = monaco.editor.create(el, MONACO_OPTIONS)
    const vimMode = initVimMode(instance, statusBarRef.current)
    useIframeStore.setState({ editor: instance })

    // const listener = editor.onDidChangeCursorPosition(
    //   throttle(
    //     (e) => {
    //       const openFile = useIframeStore.getState().openFile
    //       if (openFile) {
    //         useIframeStore.setState({
    //           openFile: {
    //             ...openFile,
    //             lineNumber: e.position.lineNumber,
    //             columnNumber: e.position.column,
    //           },
    //         })
    //       }
    //     },
    //     50,
    //     { trailing: true, leading: false }
    //   )
    // )

    return () => {
      // listener.dispose()
      // setMonacoInstance(undefined)
      // editor.dispose()
    }
  }, [editor])

  useEffect(() => {
    return () => {
      useIframeStore.setState({ editor: undefined })
    }
  }, [])

  useEffect(() => {
    const disposables = [
      editor?.onDidChangeModelContent(async (e) => {
        const model = editor.getModel()
        if (!model) return

        await apiClient.writeFile({ contents: model?.getValue(), path: model?.uri.path })
      }),
      editor?.onMouseDown((e) => {
        e.event.stopPropagation()
        e.event.preventDefault()
        if (e.event.leftButton && e.event.detail === 2) {
          // editor.setSelection(new monaco.Selection(0, 0, 0, 0))
          useIframeStore.setState({
            selectedComponent: {
              path: useIframeStore.getState().selectedComponent?.path,
              lineNumber: e.target.position?.lineNumber,
              columnNumber: e.target.position?.column,
            },
          })
        }
      }),
    ]
    return () => {
      disposables.forEach((v) => v?.dispose())
    }
  }, [editor])

  const openFile = useIframeStore((v) => v.openFile)
  const selectedComponent = useIframeStore((v) => v.selectedComponent)
  const workerAdapter = useIframeStore((v) => v.workerAdapter)
  const [delay, setDelay] = useState({})
  const decorations = useRef<string[]>([])
  useEffect(() => {
    ;(async () => {
      if (selectedComponent) {
        const path = selectedComponent.path
        if (path) {
          const uri = monaco.Uri.file(path)
          const fileCode = files?.[path]?.code || (await getFileText(path))
          const model =
            monaco.editor.getModel(uri) || (fileCode && monaco.editor.createModel(fileCode, undefined, uri))

          if (editor && model) {
            try {
              const worker = await getTypescriptWorker()
              const uriString = uri.toString()
              const offset = model.getOffsetAt({
                column: +selectedComponent.columnNumber,
                lineNumber: +selectedComponent.lineNumber,
              })
              const panels = await worker.getPanelsAtPosition(uriString, offset)
              useIframeStore.setState({ panels: panels })
              editor.removeDecorations(decorations.current)
              if (panels.range) {
                if (editor?.getModel() !== model) {
                  editor.setModel(model)
                }
                editor.revealRangeInCenterIfOutsideViewport(panels.range)
                decorations.current = editor.deltaDecorations(decorations.current, [
                  {
                    range: panels.range,
                    options: {
                      className: 'Highlighted',
                    },
                  },
                ])
              } else {
                decorations.current = []
              }
            } catch (e) {
              console.log(e)
              setTimeout(() => {
                setDelay({})
              }, 200)
            }
            // if (editor?.getModel() !== model) {
            //   editor.setModel(model)
            //   // editor?.revealLineInCenter(+selectedComponent.lineNumber)
            // } else {
            //   editor.setModel(model)
            //   // editor?.revealLineInCenter(+selectedComponent.lineNumber)
            // }
            // monacoInstance?.setPosition({ lineNumber: +openFile.lineNumber, column: +openFile.columnNumber })
            editor.focus()
          }
        }
      }
    })()
  }, [selectedComponent, delay, files, editor, workerAdapter])

  return (
    <Box sx={{ position: 'relative' }}>
      <Box ref={ref} sx={{ height: '100%', '.Highlighted': { background: 'lightblue' } }} />
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
