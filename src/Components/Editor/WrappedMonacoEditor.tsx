import * as monaco from 'monaco-editor'
import { editor } from 'monaco-editor'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useIframeStore } from '../store'
import MonacoEditor from './MonacoEditor'
import { useGetPanelsQuery } from '../Common/UseQueries'
import ReconnectingWebSocket from 'reconnecting-websocket'
import * as Y from 'yjs'
import { MonacoBinding } from './y-monaco'
import { debounce } from 'lodash-es'

function getOrCreateModelAndSubdoc(doc: Y.Doc, path: string): [editor.ITextModel, Y.Doc] {
  const uri = monaco.Uri.file(path)
  const map = doc.getMap<Y.Doc>()

  let model = monaco.editor.getModel(uri)
  if (!model) {
    model = monaco.editor.createModel('', undefined, uri)
    if (!map.has(path)) {
      const newDoc = new Y.Doc()
      map.set(path, newDoc)
    }
  }
  return [model, map.get(path)!]
}

export const WrappedMonacoEditor = ({}: {}) => {
  const ref = useRef<editor.IStandaloneCodeEditor | null>(null)
  const source = useIframeStore((v) => v.selectedFiberSource)
  const fileName = source?.fileName
  const editor = ref.current
  const [doc] = useState(() => new Y.Doc())
  useEffect(() => {}, [doc])

  const [model, subdoc] = useMemo(() => {
    if (fileName && editor) {
      return getOrCreateModelAndSubdoc(doc, fileName)
    } else return []
  }, [fileName, editor, doc])
  useEffect(() => {
    if (subdoc) {
      const client = new ReconnectingWebSocket(`ws://localhost:3001/docs/${fileName}`)
      client.addEventListener('open', () => {
        let wasInitialized = false
        client.addEventListener('message', ({ data }) => {
          const { type, payload } = JSON.parse(data) as MessageData

          switch (type) {
            case 'FILE_CONTENTS': {
              if (!subdoc || subdoc.getText().toString() == payload) return

              subdoc.transact(() => {
                subdoc.getText().delete(0, subdoc.getText().length)
                subdoc.getText().insert(0, payload)
              }, 'SERVER')
              if (!wasInitialized && model) {
                new MonacoBinding(subdoc.getText(), model) // TODO awareness
                wasInitialized = true
              }
            }
          }
        })
      })

      const debouncedSendFileUpdate = debounce(
        () => {
          client.send(
            JSON.stringify({
              type: 'FILE_UPDATE',
              payload: { filename: fileName, text: subdoc.getText().toString() },
            })
          )
        },
        100,
        { leading: false, trailing: true }
      )
      const updateListener = (update: Uint8Array, origin: any) => {
        if (origin === 'SERVER') return
        return debouncedSendFileUpdate()
      }
      subdoc.on('update', updateListener)
      let cursorPosition = 300
      const observer = (event: Y.YTextEvent) => {
        let deltaPosition = 0
        let currentPosition = 0

        // Iterate through the changes in the event
        event.changes.delta.forEach((change) => {
          if (change.retain) {
            currentPosition += change.retain
          } else if ('insert' in change) {
            if (currentPosition <= cursorPosition) {
              deltaPosition += change.insert?.length || 0
            }
            currentPosition += change.insert?.length || 0
          } else if ('delete' in change) {
            if (currentPosition < cursorPosition) {
              deltaPosition -= Math.min(change.delete || 0, cursorPosition)
            }
          }
        })

        cursorPosition += deltaPosition
      }
      subdoc.getText().observe(observer)

      return () => {
        subdoc.off('update', updateListener)
        subdoc.getText().unobserve(observer)
        client.close()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subdoc])

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

  return <MonacoEditor ref={ref} />
}

interface MessageData {
  type: 'FILE_CONTENTS'
  payload: string
}
