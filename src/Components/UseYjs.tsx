import * as Y from 'yjs'
import * as monaco from 'monaco-editor'
import { editor } from 'monaco-editor'
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import ReconnectingWebSocket from 'reconnecting-websocket'
import { MonacoBinding } from './Editor/y-monaco'
import { debounce } from 'lodash-es'
import { getSubdoc } from './GetSubdoc'

type ModelAndSubdoc = {
  model: editor.ITextModel
  subdoc: Y.Doc
}

class SharedResourceMap<T> extends Map<string, ResourceWithCounter<T>> {}


export function getOrCreateModelAndSubdoc(doc: Y.Doc, path: string): ModelAndSubdoc {
  const subdoc = getSubdoc(doc, path)

  const uri = monaco.Uri.file(path)
  let model = monaco.editor.getModel(uri)
  if (!model) {
    model = monaco.editor.createModel('', undefined, uri)
  }
  return { model, subdoc: subdoc }
}

const sharedWebsocketMap = new SharedResourceMap<ReconnectingWebSocket>()

export const MAIN_YDOC = new Y.Doc()
const useMainYjsDoc = () => {
  return MAIN_YDOC
}
export const useYjs = (fileName?: string) => {
  const doc = useMainYjsDoc()
  useSharedResource<ReconnectingWebSocket | null>(
    fileName ? `ws://localhost:3001/docs/${fileName}` : undefined,
    sharedWebsocketMap,
    () => {
      if (!fileName) return [null, null]
      const { subdoc, model } = getOrCreateModelAndSubdoc(doc, fileName)

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

      return [
        client,
        () => {
          subdoc.off('update', updateListener)
          subdoc.getText().unobserve(observer)
          client.close()
        },
      ]
    }
  )

  return fileName ? getOrCreateModelAndSubdoc(doc, fileName) : { model: null, subdoc: null }
}

interface MessageData {
  type: 'FILE_CONTENTS'
  payload: string
}

export const useYjsText = (fileName?: string) => {
  const { subdoc } = useYjs(fileName)
  return useSyncExternalStore(
    useCallback(
      (f) => {
        subdoc?.getText()?.observe(f)
        return () => {
          subdoc?.getText()?.unobserve(f)
        }
      },
      [subdoc]
    ),
    useCallback(() => subdoc?.getText().toString(), [subdoc])
  )
}

type ResourceWithCounter<T> = {
  resource: T
  counter: number
  cleanup: (() => void) | null
}

function useSharedResource<T>(
  key: string | undefined,
  sharedResources: SharedResourceMap<T>,
  initializer: () => [T, (() => void) | null]
): T | null {
  const [resource, setResource] = useState<T | null>(null)

  useEffect(() => {
    if (!key) return

    const shared =
      sharedResources.get(key) ||
      (() => {
        const [newResource, cleanup] = initializer()
        const entry: ResourceWithCounter<T> = { resource: newResource, counter: 0, cleanup }
        sharedResources.set(key, entry)
        return entry
      })()

    setResource(shared.resource)
    shared.counter += 1

    return () => {
      shared.counter -= 1
      if (shared.counter === 0) {
        shared.cleanup?.()
        sharedResources.delete(key)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, sharedResources])

  return resource
}
