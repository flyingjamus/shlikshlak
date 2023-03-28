import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../client/apiClient'
import * as monaco from 'monaco-editor'
import { editor } from 'monaco-editor'
import { useEffect, useMemo, useRef } from 'react'
import { useIframeStore } from '../store'
import MonacoEditor from './MonacoEditor'
import { useGetPanelsQuery } from '../Common/UseQueries'

function getOrCreateModel(path: string, contents = ''): editor.ITextModel {
  const uri = monaco.Uri.file(path)
  const model = monaco.editor.getModel(uri)
  if (model) {
    model.setValue(contents)
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
  const { data } = useGetFileQuery(fileName)
  const contents = data?.contents
  const model = useMemo(() => {
    if (contents && fileName) {
      return getOrCreateModel(fileName, contents)
    }
  }, [fileName, contents])

  const editor = ref.current
  const { data: panels } = useGetPanelsQuery(source)
  const decorations = useRef<string[]>([])
  useEffect(() => {
    if (!editor || !model) return
    editor.setModel(model)
    if (panels?.range) {
      editor.removeDecorations(decorations.current)

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
  }, [model, panels, editor])
  useEffect(() => {
    if (editor) {
      editor.onDidChangeCursorPosition((e) => {
        //TODO
      })
    }
  }, [editor])
  return <MonacoEditor ref={ref} />
}
