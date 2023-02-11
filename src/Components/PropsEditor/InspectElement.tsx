import { BackendEvents, FrontendBridge, InspectedElementPayload } from 'react-devtools-inline/frontend'
import { useBridge } from './UseBridge'
import { Store, useStore } from './UseStore'
import { useEffect, useState } from 'react'

function getPromiseForRequestID<T>(
  requestID: number,
  eventType: keyof BackendEvents,
  bridge: FrontendBridge,
  timeoutMessage: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      bridge.removeListener(eventType, onInspectedElement)

      clearTimeout(timeoutID)
    }

    const onInspectedElement = (data: any) => {
      if (data.responseID === requestID) {
        cleanup()
        resolve(data as T)
      }
    }

    const onTimeout = () => {
      cleanup()
      reject(new Error(timeoutMessage))
    }

    bridge.addListener(eventType, onInspectedElement)

    const timeoutID = setTimeout(onTimeout, TIMEOUT_DELAY)
  })
}

const TIMEOUT_DELAY = 5000
let nextId = 0
export const inspectElement = ({
  bridge,
  id,
  store,
}: {
  store: Store
  bridge: FrontendBridge
  id: number
}) => {
  const requestID = ++nextId
  const promise = getPromiseForRequestID<InspectedElementPayload>(
    requestID,
    'inspectedElement',
    bridge,
    `Timed out while inspecting element ${id}.`
  )
  const rendererId = store.getRendererIDForElement(id)
  bridge.send('inspectElement', {
    forceFullData: false,
    id,
    rendererID: rendererId!,
    requestID: requestID,
    path: null,
  })

  return promise
}

export const useInspectElement = (id: number) => {
  const bridge = useBridge()
  const store = useStore()
  const [result, setResult] = useState<InspectedElementPayload | undefined>()

  useEffect(() => {
    if (!id || !bridge || !store) {
      setResult(undefined)
      return
    }
    const promise = inspectElement({ store, bridge, id })
    promise.then((res) => {
      setResult(res)
    })
  }, [bridge, id, store])
  return result
}
