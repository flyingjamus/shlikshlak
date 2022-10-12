import { Box } from '@mui/material'
import { useEffect, useRef } from 'react'
import { throttle } from 'lodash-es'

function setStyle(elem: HTMLDivElement, propertyObject: Partial<CSSStyleDeclaration>) {
  for (const property in propertyObject) elem.style[property] = propertyObject[property] as string
}

function getHightlightStyle(highlighted?: Element) {
  if (!highlighted) {
    return {
      display: 'none',
    }
  }
  const { left, top, height, width } = highlighted.getBoundingClientRect()

  return {
    display: 'block',
    left: left + 'px',
    top: top + 'px',
    height: height + 'px',
    width: width + 'px',
  }
}

export const PreviewOverlay = () => {
  const highlightRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let highlighted: Element | null
    let selected: Element | null
    const listener = throttle((e: MouseEvent) => {
      highlighted = document.elementFromPoint(e.clientX, e.clientY)
      const el = highlightRef.current
      if (!el || !highlighted) return
      if (!highlighted) {
        el.style.display = 'none'
      } else {
        const hightlightStyle = getHightlightStyle(highlighted)
        setStyle(el, hightlightStyle)
      }
    }, 100)

    const clickListener = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const el = selectedRef.current
      if (!el) return
      const allElements = document.elementsFromPoint(e.clientX, e.clientY)
      const index = selected ? allElements.indexOf(selected) : -1
      if (index < 0 || index === allElements.length - 1) {
        selected = allElements[0]
      } else {
        selected = allElements[index + 1]
      }
      if (!selected) {
        el.style.display = 'none'
      } else {
        const hightlightStyle = getHightlightStyle(selected)
        setStyle(el, hightlightStyle)
      }
    }

    const mouseOutListener = (e: MouseEvent) => {
      const el = highlightRef.current
      if (el) {
        el.style.display = 'none'
      }
    }

    window.addEventListener('mousemove', listener)
    window.addEventListener('click', clickListener)
    window.addEventListener('mouseout', mouseOutListener)
    return () => {
      window.removeEventListener('mousemove', listener)
      window.removeEventListener('click', clickListener)
      window.removeEventListener('mouseout', mouseOutListener)
    }
  }, [])

  return (
    <>
      <Box
        ref={highlightRef}
        sx={{ background: 'rgba(0,0,0,0.2)', position: 'fixed', pointerEvents: 'none' }}
        // style={}
      />
      <Box
        ref={selectedRef}
        sx={{ border: '1px solid hotpink', position: 'fixed', pointerEvents: 'none' }}
        // style={}
      />
    </>
  )
}
