import { useCallback, useContext, useEffect, useState } from 'react'
import {
  BridgeContext,
  StoreContext,
} from '../Components/ReactDevtools/react-devtools-shared/src/devtools/views/context'
import {
  getElementDimensions,
  getNestedBoundingClientRect,
} from '../Components/ReactDevInspectorUtils/overlay'
import { useDevtoolsStore } from './DevtoolsStore'

export function useHighlightNativeElement() {
  const bridge = useContext(BridgeContext)
  const store = useContext(StoreContext)
  const highlightNativeElement = useCallback(
    (id: number) => {
      const element = store.getElementByID(id)
      const rendererID = store.getRendererIDForElement(id)

      if (element !== null && rendererID !== null) {
        bridge.send('highlightNativeElement', {
          displayName: element.displayName,
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
export const DevtoolsOverlay = () => {
  const [] = useState()
  const left = useDevtoolsStore((v) => v.box?.left)
  const top = useDevtoolsStore((v) => v.box?.top)
  const width = useDevtoolsStore((v) => v.box?.width)
  const height = useDevtoolsStore((v) => v.box?.height)
  useEffect(() => {
    registerListenersOnWindow()
  }, [])
  return (
    <div
      style={{
        position: 'absolute',
        background: 'hotpink',
        left: left + 'px',
        top: top + 'px',
        width: width + 'px',
        height: height + 'px',
      }}
    ></div>
  )
}

function registerListenersOnWindow() {
  if (window && typeof window.addEventListener === 'function') {
    window.addEventListener('click', noop, true)
    window.addEventListener('mousedown', noop, true)
    window.addEventListener('mouseover', noop, true)
    window.addEventListener('mouseup', noop, true)
    window.addEventListener('pointerdown', noop, true)
    window.addEventListener(
      'pointerover',
      (event) => {
        const element = event.target as any as HTMLElement
        const box = getNestedBoundingClientRect(element, window)
        const dims = getElementDimensions(element)
        useDevtoolsStore.setState({
          box,
          dims,
        })
      },
      true
    )
    window.addEventListener('pointerup', noop, true)
  }
}

const noop: EventListener = (e) => {
  e.preventDefault()
  e.stopPropagation()
}

// const box = getNestedBoundingClientRect(element, this.window)
// const dims = getElementDimensions(element)
// outerBox.top = Math.min(outerBox.top, box.top - dims.marginTop)
// outerBox.right = Math.max(outerBox.right, box.left + box.width + dims.marginRight)
// outerBox.bottom = Math.max(outerBox.bottom, box.top + box.height + dims.marginBottom)
// outerBox.left = Math.min(outerBox.left, box.left - dims.marginLeft)
