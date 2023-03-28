import { useCallback } from 'react'
import { useStore } from './UseStore'
import { useBridge } from './UseBridge'

export function useHighlightNativeElement() {
  const bridge = useBridge()
  const store = useStore()

  const highlightNativeElement = useCallback(
    (id: number) => {
      const element = store.getElementByID(id)
      const rendererID = store.getRendererIDForElement(id)
      if (element !== null && rendererID !== null) {
        bridge.send('highlightNativeElement', {
          displayName: null,
          hideAfterTimeout: false,
          id,
          openNativeElementsPanel: false,
          rendererID,
          scrollIntoView: false,
        })
      }
    },
    [store, bridge]
  )

  const clearHighlightNativeElement = useCallback(() => {
    bridge.send('clearNativeElementHighlight')
  }, [bridge])

  return {
    highlightNativeElement,
    clearHighlightNativeElement,
  }
}
