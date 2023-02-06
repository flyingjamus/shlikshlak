import { Box } from '@mui/material'
import { useEffect, useRef } from 'react'
import { last, throttle } from 'lodash-es'
import { useIframeStore } from '../Components/store'
import { apiHooks } from '../client/apiClient'
import type { AppNode } from './Devtools'
import { useDevtoolsStore } from './DevtoolsStore'

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

function setHighlightedId(id: number | undefined) {
  useDevtoolsStore.setState({ highlightedId: id })
}

export const DevtoolsOverlay = () => {
  const highlightRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLDivElement>(null)
  const ref = useRef<HTMLDivElement>()
  const childConnection = useIframeStore((v) => v.childConnection)
  const { data: initData } = apiHooks.useQuery('/init')
  const rootPath = initData?.rootPath || ''

  const highlightedId = useDevtoolsStore((v) => v.highlightedId)
  const selectedId = useDevtoolsStore((v) => v.selectedId)

  useEffect(() => {
    ;(async () => {
      const el = highlightRef.current
      if (highlightedId && el) {
        const elementStyle = await childConnection?.elementStyle(highlightedId)
        const highlightStyle = getHightlightStyle(elementStyle?.[0]?.rect)
        setStyle(el, highlightStyle)
      }
    })()
  }, [childConnection, highlightedId])

  useEffect(() => {
    let x: number | undefined = undefined
    let y: number | undefined = undefined
    let ctrl = false
    let hoverAncestors: AppNode[] | undefined

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
      const highlightedId = useDevtoolsStore.getState().highlightedId
      const selectedId = useDevtoolsStore.getState().selectedId
      if (!x || !y || !childConnection) return
      hoverAncestors = await childConnection.nodesFromPoint(x, y)

      const hoverElement = hoverAncestors[0]
      if (hoverElement) {
        if (!ctrl) {
          setHighlightedId(hoverElement.id)
        } else if (selectedId) {
          const selected = await childConnection.getNodeById(selectedId)
          if (selected) {
            const selectedAncestors = await getAncestors(selected)
            for (const [i, element] of hoverAncestors.entries()) {
              const parent = hoverAncestors[i + 1]
              if (parent && selectedAncestors.some((v) => v.id === parent.id)) {
                setHighlightedId(element.id)
                break
              }
            }
            if (!highlightedId) {
              setHighlightedId(last(hoverAncestors)?.id)
            }
          }
        } else {
          setHighlightedId(last(hoverAncestors)?.id)
        }
        if (useDevtoolsStore.getState().highlightedId === useDevtoolsStore.getState().selectedId) {
          setHighlightedId(undefined)
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

    const highlightById = async (id: number) => {
      const selectedEl = selectedRef.current
      if (!selectedEl) return
      useDevtoolsStore.setState({ selectedId: id })
      if (!id) {
        selectedEl.style.display = 'none'
      } else {
        setElementStyle(id, selectedEl)

        const res = await childConnection?.sourceFromId(id)
        // const path = res?.absolutePath?.slice(rootPath?.length + 1)
        const path = res?.absolutePath
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

    const clickListener = async (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const highlightedId = useDevtoolsStore.getState().highlightedId
      const selected = highlightedId && (await childConnection?.getNodeById(highlightedId))
      const selectedAncestors = selected && (await getAncestors(selected))
      useIframeStore.setState({ elementsStack: selectedAncestors || undefined })
      if (highlightedId) {
        await highlightById(highlightedId)
      }
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
      setHighlightedId(undefined)
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
  }, [childConnection, highlightedId, rootPath.length, selectedId])

  return (
    <Box
      ref={ref}
      sx={{ position: 'absolute', width: '100%', height: '100%', left: 0, top: 0, overflow: 'hidden' }}
    >
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
