import React, { useEffect, useRef, useState } from 'react'
import { Box, IconButton } from '@mui/material'
import * as monaco from 'monaco-editor'
import { editor } from 'monaco-editor'
import { OpenFile, useFileStore, useIframeStore } from '../store'
import { getFileText } from '../../tsworker/fileGetter'
import { COMPILER_OPTIONS } from './COMPILER_OPTIONS'
import { apiClient } from '../../client/apiClient'
import { MONACO_OPTIONS } from './MONACO_OPTIONS'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
// @ts-ignore
import { initVimMode } from 'monaco-vim'
import { WorkerAdapter } from '../../tsworker/workerAdapter'
import { getTypescriptWorker } from '../../tsworker/GetTypescriptWorker'
import IModel = editor.IModel
import ITextModel = editor.ITextModel

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

async function updateModelPanels() {
  const selectedComponent = useIframeStore.getState().selectedComponent
  if (!selectedComponent) return

  const model = await getOrCreateModel(selectedComponent.path)
  const worker = await getTypescriptWorker()
  const uriString = model.uri.toString()
  const offset = model.getOffsetAt({
    column: +selectedComponent.columnNumber,
    lineNumber: +selectedComponent.lineNumber,
  })
  const panels = await worker.getPanelsAtPosition(uriString, offset)
  useIframeStore.setState({ panels: panels })
  return panels
}

async function getOrCreateModel(path: string): Promise<ITextModel> {
  const uri = monaco.Uri.file(path)
  const fileCode = useFileStore.getState().files?.[path]?.code || (await getFileText(path))
  if (!fileCode) throw new Error('Missing filecode')
  return monaco.editor.getModel(uri) || monaco.editor.createModel(fileCode, undefined, uri)
}

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
      return () => {
        editor.dispose()
        useIframeStore.setState({ editor: undefined })
      }
    }

    const instance = monaco.editor.create(el, MONACO_OPTIONS)
    const vimMode = initVimMode(instance, statusBarRef.current)
    useIframeStore.setState({ editor: instance })

    return () => {
      // listener.dispose()
      // setMonacoInstance(undefined)
      // instance.dispose()
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

        updateModelPanels().then((v) => v)
        apiClient.writeFile({ contents: model?.getValue(), path: model?.uri.path }).then((v) => v)
      }),
      editor?.onMouseDown((e) => {
        e.event.stopPropagation()
        e.event.preventDefault()
        if (e.event.leftButton && e.event.detail === 2) {
          // editor.setSelection(new monaco.Selection(0, 0, 0, 0))
          const selectedComponent = useIframeStore.getState().selectedComponent
          useIframeStore.setState({
            selectedComponent: {
              path: selectedComponent?.path,
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
          const model = await getOrCreateModel(path)
          if (editor && model) {
            try {
              const panels = await updateModelPanels()
              editor.removeDecorations(decorations.current)
              if (panels?.range) {
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
