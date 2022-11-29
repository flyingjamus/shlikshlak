import { Box } from '@mui/material'
import { useEffect, useRef } from 'react'
import type { Element } from '../Components/ReactDevtools/react-devtools-shared/src/devtools/views/Components/types'
import { last, throttle } from 'lodash-es'
import {
  getElementDimensions,
  getNestedBoundingClientRect,
} from '../Components/ReactDevInspectorUtils/overlay'
import { useIframeStore } from '../Components/store'
import { apiHooks } from '../client/apiClient'

function setStyle(elem: HTMLElement, propertyObject: Partial<CSSStyleDeclaration>) {
  for (const property in propertyObject) elem.style[property] = propertyObject[property] as string
}

function getHightlightStyle(rect?: DOMRect) {
  if (!rect) {
    return {
      display: 'none',
    }
  }

  const { left, top, height, width } = rect

  return {
    display: 'block',
    left: left + 'px',
    top: top + 'px',
    height: height + 'px',
    width: width + 'px',
  }
}

export const DevtoolsOverlay = () => {
  const highlightRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLDivElement>(null)
  const ref = useRef<HTMLDivElement>()
  const childConnection = useIframeStore((v) => v.childConnection)
  const store = useIframeStore((v) => v.devtoolsStore)
  const bridge = useIframeStore((v) => v.devtoolsBridge)
  const { data: initData } = apiHooks.useQuery('/init')
  const rootPath = initData?.rootPath || ''

  useEffect(() => {
    let highlightedId: number | undefined
    let selectedId: number | undefined
    let x: number | undefined = undefined
    let y: number | undefined = undefined
    let ctrl = false

    const current = ref.current!

    const getAncestors = (element: Element) => {
      let parent: Element | null | undefined = element
      const res: Element[] = []
      // TODO id StoryRoot better
      while (parent && parent.displayName !== 'StoryRoot') {
        res.push(parent)
        parent = (parent.parentID && store?.getElementByID(parent.parentID)) || undefined
      }
      return res
    }

    const listener = throttle(async () => {
      const elementId = await childConnection?.idFromPoint(x, y)
      const hoverElement = elementId && store?.getElementByID(elementId)
      if (hoverElement) {
        const hoverAncestors = getAncestors(hoverElement)
        if (ctrl) {
          highlightedId = elementId
        } else if (selectedId) {
          const selected = store?.getElementByID(selectedId)
          if (selected) {
            const selectedAncestors = getAncestors(selected)
            for (const element of hoverAncestors) {
              if (element.parentID && selectedAncestors.some((v) => v.id === element.parentID)) {
                highlightedId = element.id
                break
              }
            }
            if (!highlightedId) {
              highlightedId = last(hoverAncestors)?.id
            }
          }
        } else {
          highlightedId = last(hoverAncestors)?.id
        }
        if (highlightedId === selectedId) {
          highlightedId = undefined
        }
      }

      const el = highlightRef.current
      if (!el) return
      if (!highlightedId) {
        el.style.display = 'none'
      } else {
        setElementStyle(highlightedId, el)
      }
    }, 100)

    const setElementStyle = async (highlightedId: number, el: HTMLElement) => {
      const rendererIDForElement = store?.getRendererIDForElement(highlightedId)
      if (rendererIDForElement) {
        const elementStyle = await childConnection?.elementStyle(highlightedId, rendererIDForElement)
        const highlightStyle = getHightlightStyle(elementStyle?.[0]?.rect)
        setStyle(el, highlightStyle)
      }
    }

    const clickListener = async (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const selectedEl = selectedRef.current
      if (!selectedEl) return

      if (highlightedId) {
        selectedId = highlightedId
      }
      if (!selectedId) {
        selectedEl.style.display = 'none'
      } else {
        setElementStyle(selectedId, selectedEl)

        const rendererID = store?.getRendererIDForElement(selectedId)
        if (rendererID) {
          const res = await childConnection?.sourceFromId(selectedId, rendererID)
          const path = res?.[0]?.absolutePath?.slice(rootPath?.length + 1)
          if (res?.[0]) {
            useIframeStore.setState({
              selectedComponent: {
                path: path,
                lineNumber: res[0].lineNumber,
                columnNumber: res[0].columnNumber,
              },
            })
          }
        }
      }
      listener()
    }

    const keyDownListener = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        ctrl = true
      }
      listener()
    }
    const keyUpListener = (e: KeyboardEvent) => {
      if (!e.ctrlKey) {
        ctrl = false
      }
      listener()
    }
    const mouseMoveListener = (e: MouseEvent) => {
      const { x: outerX, y: outerY } = current.getBoundingClientRect()
      x = e.clientX - outerX
      y = e.clientY - outerY
      ctrl = e.ctrlKey
      listener()
    }

    const mouseOutListener = (e: MouseEvent) => {
      highlightedId = undefined
      x = undefined
      y = undefined
      listener()
    }

    current.addEventListener('mousemove', mouseMoveListener)
    current.addEventListener('mousedown', clickListener)
    window.addEventListener('keydown', keyDownListener)
    window.addEventListener('keyup', keyUpListener)
    current.addEventListener('mouseout', mouseOutListener)
    return () => {
      current.removeEventListener('mousemove', mouseMoveListener)
      current.removeEventListener('mousedown', clickListener)
      window.removeEventListener('keydown', keyDownListener)
      window.removeEventListener('keyup', keyUpListener)
      current.removeEventListener('mouseout', mouseOutListener)
    }
  }, [childConnection, store])

  return (
    <Box ref={ref} sx={{ position: 'absolute', width: '100%', height: '100%', left: 0, top: 0 }}>
      <Box
        ref={highlightRef}
        sx={{
          position: 'absolute',
          pointerEvents: 'all',
          border: '2px solid rgba(0,0,0,1)',
          borderColor: '#9575CD',
          boxSizing: 'border-box',
          zIndex: '10000000',
          display: 'none',
        }}
        // style={}
      />
      <Box
        ref={selectedRef}
        sx={{
          position: 'absolute',
          pointerEvents: 'all',
          boxSizing: 'border-box',
          border: '1px solid rgba(0,0,0,1)',
          borderColor: '#9575CD',
          zIndex: '10000000',
          display: 'none',
        }}
        // style={}
      />
    </Box>
  )
}
