import PQueue from 'p-queue'
import { apiClient } from '../client/apiClient'
import { useIframeStore } from '../Components/store'
import produce from 'immer'
import { last } from 'lodash-es'

const attributesQueues: Record<string, PQueue> = {}

type AttributeValue = string | true | undefined

export async function setAttribute(fileName: string, location: number, prop: string, value: AttributeValue) {
  attributesQueues[fileName] ||= new PQueue({ concurrency: 1 })
  const p = attributesQueues[fileName]
  p.clear()
  await p.add(async ({}) => {
    const { error, undoChanges } = await apiClient.post('/lang/setAttributeAtPosition', {
      fileName,
      position: location,
      attrName: prop,
      value,
    })
    if (undoChanges) {
      useIframeStore.setState({
        undoStack: produce(useIframeStore.getState().undoStack, (v) => {
          v.push({ undoChanges })
        }),
      })
    }
  })
}

const changesQueue = new PQueue({ concurrency: 1 })

export async function undoChange() {
  return changesQueue.add(async ({}) => {
    const item = last(useIframeStore.getState().undoStack)

    if (item) {
      const { error, undoChanges } = await apiClient.post('/do_change', { changes: item.undoChanges })
      if (undoChanges) {
        useIframeStore.setState({
          undoStack: produce(useIframeStore.getState().undoStack, (v) => {
            v.pop()
          }),
          redoStack: produce(useIframeStore.getState().redoStack, (v) => {
            v.push({ undoChanges })
          }),
        })
      }
    }
  })
}

export async function redoChange() {
  return changesQueue.add(async ({}) => {
    const item = last(useIframeStore.getState().redoStack)

    if (item) {
      const { error, undoChanges } = await apiClient.post('/do_change', { changes: item.undoChanges })
      if (undoChanges) {
        useIframeStore.setState({
          undoStack: produce(useIframeStore.getState().undoStack, (v) => {
            v.push({ undoChanges })
          }),
          redoStack: produce(useIframeStore.getState().redoStack, (v) => {
            v.pop()
          }),
        })
      }
    }
  })
}
