import { Box } from '@mui/material'
import { useEffect, useRef } from 'react'
import { last, throttle } from 'lodash-es'
import { useIframeStore } from '../Components/store'
import { apiHooks } from '../client/apiClient'
import type { AppNode } from './Devtools'

const store = null

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
  const { data: initData } = apiHooks.useQuery('/init')
  const rootPath = initData?.rootPath || ''

  useEffect(() => {
    let highlightedId: number | undefined
    let selectedId: number | undefined
    let x: number | undefined = undefined
    let y: number | undefined = undefined
    let ctrl = false

    const current = ref.current!

    const getAncestors = async (element: AppNode) => {
      let parent: AppNode | null | undefined = element
      const res: AppNode[] = []
      // TODO id StoryRoot better
      while (parent && parent.displayName !== 'StoryRoot') {
        res.push(parent)
        parent = (parent.parentId && (await childConnection?.getNodeById(parent.parentId))) || undefined
      }
      return res
    }

    const listener = throttle(async () => {
      if (!x || !y || !childConnection) return
      const hoverAncestors = await childConnection.nodesFromPoint(x, y)
      const hoverElement = hoverAncestors[0]
      if (hoverElement) {
        if (ctrl) {
          highlightedId = hoverElement.id
        } else if (selectedId) {
          const selected = await childConnection.getNodeById(selectedId)
          if (selected) {
            const selectedAncestors = await getAncestors(selected)
            for (const element of hoverAncestors) {
              if (element?.parentId && selectedAncestors.some((v) => v.id === element.parentId)) {
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
      const elementStyle = await childConnection?.elementStyle(highlightedId)
      const highlightStyle = getHightlightStyle(elementStyle?.[0]?.rect)
      setStyle(el, highlightStyle)
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

        const res = await childConnection?.sourceFromId(selectedId)
        const path = res?.absolutePath?.slice(rootPath?.length + 1)
        if (res && path) {
          useIframeStore.setState({
            selectedComponent: {
              path: path,
              lineNumber: +res.lineNumber,
              columnNumber: +res.columnNumber,
            },
          })
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
  }, [childConnection, rootPath?.length, store])

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
