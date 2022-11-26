import { Box } from '@mui/material'
import { useEffect, useRef } from 'react'
import { throttle } from 'lodash-es'
import {
  getElementDimensions,
  getNestedBoundingClientRect,
} from '../Components/ReactDevInspectorUtils/overlay'
import { useIframeStore } from '../Components/store'

function setStyle(elem: HTMLDivElement, propertyObject: Partial<CSSStyleDeclaration>) {
  for (const property in propertyObject) elem.style[property] = propertyObject[property] as string
}

function getHightlightStyle(highlighted?: Element) {
  if (!highlighted) {
    return {
      display: 'none',
    }
  }

  const element = highlighted as any as HTMLElement
  const { left, top, height, width } = getNestedBoundingClientRect(element, window)
  const dims = getElementDimensions(element)

  return {
    display: 'block',
    left: left + 'px',
    top: top + 'px',
    height: height + 'px',
    width: width + 'px',
  }
}

const getAncestors = (element: Element) => {
  let parent: Element | null = element
  const res: Element[] = []
  while (parent) {
    res.push(parent)
    parent = parent.parentElement
  }
  return res
}
export const PreviewOverlay = () => {
  const highlightRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLDivElement>(null)
  const ref = useRef<HTMLDivElement>()
  const childConnection = useIframeStore((v) => v.childConnection)
  const store = useIframeStore((v) => v.devtoolsStore)
  const bridge = useIframeStore((v) => v.devtoolsBridge)

  useEffect(() => {
    let highlighted: Element | null
    let selected: Element | null
    let x = 0
    let y = 0
    let ctrl = false

    const getElementsFromPoint = () => {
      const elements = document
        .elementsFromPoint(x, y)
        .filter((v) => v !== highlightRef.current && v !== selectedRef.current)
      const rootIndex = elements.findIndex((v) => v.id === 'root')
      return elements.slice(0, rootIndex + 1)
    }
    const listener = throttle(async () => {
      const id = await childConnection?.highlightPoint({
        clientX: x,
        clientY: y,
      })
      let parent = store?.getElementByID(id)
      // while (parent) {
      //   console.log(parent, parent.parentID)
      //   parent = parent.parentID ? store?.getElementByID(parent.parentID) : undefined
      // }

      const allElements = getElementsFromPoint()

      const el = highlightRef.current
      if (ctrl) {
        highlighted = allElements[0]
      } else if (selected) {
        const ancestors = getAncestors(selected)
        for (const element of allElements) {
          if (element.parentElement && ancestors.includes(element.parentElement)) {
            highlighted = element
            break
          } else if (element.parentElement === selected) {
            highlighted = element
            break
          }
        }
        if (!highlighted) {
          highlighted = allElements[allElements.length - 2]
        }
      } else {
        highlighted = allElements[allElements.length - 2]
      }
      if (highlighted === selected) {
        highlighted = null
      }

      if (!el) return
      if (!highlighted) {
        el.style.display = 'none'
      } else {
        const highlightStyle = getHightlightStyle(highlighted)
        setStyle(el, highlightStyle)
      }
    }, 100)

    const clickListener = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const el = selectedRef.current
      if (!el) return

      if (highlighted) {
        selected = highlighted
      }
      if (!selected) {
        el.style.display = 'none'
      } else {
        const hightlightStyle = getHightlightStyle(selected)
        setStyle(el, hightlightStyle)
      }
      listener()
    }

    const keyDownListener = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        ctrl = true
        listener()
      }
    }
    const keyUpListener = (e: KeyboardEvent) => {
      if (!e.ctrlKey) {
        ctrl = false
        listener()
      }
    }
    const current = ref.current!
    const mouseMoveListener = (e: MouseEvent) => {
      const { x: xDiff, y: yDiff } = current.getBoundingClientRect()
      x = e.clientX - xDiff
      y = e.clientY - yDiff
      ctrl = e.ctrlKey
      listener()
    }

    const mouseOutListener = (e: MouseEvent) => {
      const el = highlightRef.current
      if (el) {
        el.style.display = 'none'
      }
    }

    if (current) {
      current.addEventListener('mousemove', mouseMoveListener)
      current.addEventListener('mousedown', clickListener)
      current.addEventListener('keydown', keyDownListener)
      current.addEventListener('keyup', keyUpListener)
      // window.addEventListener('mouseout', mouseOutListener)
      return () => {
        current.removeEventListener('mousemove', mouseMoveListener)
        current.removeEventListener('mousedown', clickListener)
        current.removeEventListener('keydown', keyDownListener)
        current.removeEventListener('keyup', keyUpListener)
        // window.removeEventListener('mouseout', mouseOutListener)
      }
    }
  }, [childConnection, store])

  return (
    <Box ref={ref} sx={{ position: 'absolute', width: '100%', height: '100%', left: 0, top: 0 }}>
      <Box
        ref={highlightRef}
        sx={{
          position: 'fixed',
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
          position: 'fixed',
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
