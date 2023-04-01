import { useQuery } from '@tanstack/react-query'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { HocuspocusProvider } from '@hocuspocus/provider'
import { MonacoBinding } from 'y-monaco'
import { apiClient } from '../../client/apiClient'
import * as monaco from 'monaco-editor'
import { editor } from 'monaco-editor'
import { useEffect, useMemo, useRef } from 'react'
import { useIframeStore } from '../store'
import MonacoEditor from './MonacoEditor'
import { useGetPanelsQuery } from '../Common/UseQueries'
import { TextChangeSchema } from '../../common/api'
import { doChange } from '../../tsworker/workerAdapter'

function getOrCreateModel(path: string, contents = ''): editor.ITextModel {
  const uri = monaco.Uri.file(path)
  const model = monaco.editor.getModel(uri)
  if (model) {
    if (contents) {
      model.setValue(contents)
    }
    return model
  }
  return monaco.editor.createModel(contents, undefined, uri)
}

function useGetFileQuery(fileName: string | undefined) {
  return useQuery(
    ['get_file', fileName],
    () => (fileName ? apiClient.post('/get_file', { path: fileName }) : undefined),
    { enabled: !!fileName }
  )
}

export const WrappedMonacoEditor = ({}: {}) => {
  const ref = useRef<editor.IStandaloneCodeEditor | null>(null)
  const source = useIframeStore((v) => v.selectedFiberSource)
  const fileName = source?.fileName
  const model = useMemo(() => {
    if (fileName) {
      return getOrCreateModel(fileName)
    }
  }, [fileName])

  const editor = ref.current
  const { data: panels } = useGetPanelsQuery(source)
  const decorations = useRef<string[]>([])
  useEffect(() => {
    if (!editor || !model) return
    editor.setModel(model)
    // if (panels?.range) {
    //   editor.removeDecorations(decorations.current)
    //
    //   if (editor?.getModel() !== model) {
    //     editor.setModel(model)
    //   }
    //   editor.revealRangeInCenterIfOutsideViewport(panels.range)
    //   decorations.current = editor.deltaDecorations(decorations.current, [
    //     {
    //       range: panels.range,
    //       options: {
    //         className: 'Highlighted',
    //       },
    //     },
    //   ])
    // } else {
    //   decorations.current = []
    // }
  }, [model, panels, editor])

  useEffect(() => {
    if (editor && model) {
      console.log('binding')
      const provider = new HocuspocusProvider({
        name: model.uri.path,
        url: 'ws://localhost:3001/docs',
        quiet: false,
        onStatus: (data) => {
          console.log(31232132, data)
        },
      })

      const type = provider.document.getText()

      let monacoBinding: MonacoBinding | undefined = undefined

      provider.on('sync', () => {
        monacoBinding = new MonacoBinding(type, model, new Set([editor]), provider.awareness)
        editor.setModel(model)
      })
      return () => {
        provider.destroy()
        monacoBinding?.destroy()
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, editor])

  // useEffect(() => {
  //   if (editor) {
  //     const onDidChangeModelContent = async (e: editor.IModelContentChangedEvent) => {
  //       // if (!fileName) return
  //       // const changes = e.changes.map(
  //       //   ({ range, rangeLength, rangeOffset, text }) =>
  //       //     ({ span: { start: rangeOffset, length: rangeLength }, newText: text } as TextChangeSchema)
  //       // )
  //       // await doChange([{ fileName, textChanges: changes }])
  //     }
  //     const disposables = [editor.onDidChangeModelContent(onDidChangeModelContent)]
  //
  //     // editor.onDidChangeCursorPosition((e) => {
  //     //   // console.log(e)
  //     //   //TODO
  //     // })
  //     return () => {
  //       disposables.forEach((d) => d.dispose())
  //     }
  //   }
  // }, [editor, fileName])
  return <MonacoEditor ref={ref} />
}
