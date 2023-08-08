import * as Y from 'yjs'
import * as monaco from 'monaco-editor'
import { editor } from 'monaco-editor'
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import ReconnectingWebSocket from 'reconnecting-websocket'
import { MonacoBinding } from './Editor/y-monaco'
import { debounce } from 'lodash-es'
import { getSubdoc } from './GetSubdoc'
import { useIframeStore } from './store'

type ModelAndSubdoc = {
  model: editor.ITextModel
  subdoc: Y.Doc
  undoManager: Y.UndoManager
  text: Y.Text
}

class SharedResourceMap<T> extends Map<string, ResourceWithCounter<T>> {}
const undoManagerMap = new Map<string, Y.UndoManager>()

export const YjsOriginType = {
  MONACO: 'MONACO',
  PROPS_EDITOR: 'PROPS_EDITOR',
  SERVER: 'SERVER',
}

export function getOrCreateModelAndSubdoc(path: string): ModelAndSubdoc {
  const doc = getMainYJSDoc()
  const subdoc = getSubdoc(doc, path)

  const uri = monaco.Uri.file(path)
  let model = monaco.editor.getModel(uri)
  if (!model) {
    model = monaco.editor.createModel('', undefined, uri)
  }

  const text = subdoc.getText()
  if (text && !undoManagerMap.has(path)) {
    undoManagerMap.set(
      path,
      new Y.UndoManager(text, { trackedOrigins: new Set([YjsOriginType.PROPS_EDITOR, YjsOriginType.MONACO]) })
    )
  }
  return { model, subdoc: subdoc, undoManager: undoManagerMap.get(path)!, text }
}

export const getActiveModelAndSubdoc = () => {
  const openFile = useIframeStore.getState().selectedFiberSource
  return openFile && getOrCreateModelAndSubdoc(openFile?.fileName)
}

const sharedWebsocketMap = new SharedResourceMap<ReconnectingWebSocket>()

export const MAIN_YDOC = new Y.Doc()
const getMainYJSDoc = () => {
  return MAIN_YDOC
}
export const useYjs = (fileName?: string) => {
  useSharedResource<ReconnectingWebSocket | null>(
    fileName ? `ws://localhost:3001/docs/${fileName}` : undefined,
    sharedWebsocketMap,
    () => {
      if (!fileName) return [null, null]
      const { subdoc, model, text } = getOrCreateModelAndSubdoc(fileName)

      const client = new ReconnectingWebSocket(`ws://localhost:3001/docs/${fileName}`)
      client.addEventListener('open', () => {
        let wasInitialized = false
        client.addEventListener('message', ({ data }) => {
          const { type, payload } = JSON.parse(data) as MessageData

          switch (type) {
            case 'FILE_CONTENTS': {
              if (!subdoc || text.toString() == payload) return

              subdoc.transact(() => {
                text.delete(0, text.length)
                text.insert(0, payload)
              }, YjsOriginType.SERVER)
              if (!wasInitialized && model) {
                new MonacoBinding(text, model) // TODO awareness
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
              payload: { filename: fileName, text: text.toString() },
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
      text.observe(observer)

      return [
        client,
        () => {
          subdoc.off('update', updateListener)
          text.unobserve(observer)
          client.close()
        },
      ]
    }
  )

  return fileName
    ? getOrCreateModelAndSubdoc(fileName)
    : { model: null, subdoc: null, undoManager: null, text: null }
}

interface MessageData {
  type: 'FILE_CONTENTS'
  payload: string
}

export const watchYjsString = (text?: Y.Text | null) => {
  return useSyncExternalStore(
    useCallback(
      (f) => {
        text?.observe(f)
        return () => {
          text?.unobserve(f)
        }
      },
      [text]
    ),
    useCallback(() => text?.toString(), [text])
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
