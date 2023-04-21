import { editor } from 'monaco-editor'
import { useEffect, useRef } from 'react'
import { useIframeStore } from '../store'
import MonacoEditor from './MonacoEditor'
import { useGetPanelsQuery } from '../Common/UseQueries'
import { useYjs } from '../UseYjs'

export const WrappedMonacoEditor = ({}: {}) => {
  const ref = useRef<editor.IStandaloneCodeEditor | null>(null)
  const source = useIframeStore((v) => v.selectedFiberSource)
  const fileName = source?.fileName
  const editor = ref.current

  const { data: panels } = useGetPanelsQuery(source)
  const decorations = useRef<string[]>([])
  const [model] = useYjs(fileName)
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

  return <MonacoEditor ref={ref} />
}
