import { useIframeStore } from '../store'
import { Box, lighten } from '@mui/material'
import { useDevtoolsStore } from '../../Devtools/DevtoolsStore'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppNode } from '../../Devtools/Devtools'
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso'
import { Element, useStore } from './UseStore'
import { useBridge } from './UseBridge'
import { times } from 'lodash-es'
import { isDefined } from 'ts-is-defined'
import { useInspectElement } from './InspectElement'

const useElementsStack = () => {
  const selectedId = useDevtoolsStore((v) => v.selectedNode?.id)
  const childConnection = useIframeStore((v) => v.childConnection)
  const [stack, setStack] = useState<AppNode[] | undefined>()
  useEffect(() => {
    ;(async () => {
      if (!childConnection || !selectedId) {
        setStack(undefined)
        return
      }
      const ancestors = await childConnection.getAncestors(selectedId)
      setStack(ancestors)
    })()
  }, [childConnection, selectedId])
  return stack
}

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
export const ElementsStack = () => {
  const store = useStore()

  return store ? <Tree /> : null
}

export const Tree = () => {
  const bridge = useBridge()
  const store = useStore()

  const initialRevision = useMemo(() => store?.revision, [store])
  const [rerender, setRerender] = useState({})
  useEffect(() => {
    if (!store) return
    const handleStoreMutated = ([addedElementIDs, removedElementIDs]: [
      Array<number>,
      Map<number, number>
    ]) => {
      setRerender({})
    }

    // Since this is a passive effect, the flatTree may have been mutated before our initial subscription.
    if (store.revision !== initialRevision) {
      // At the moment, we can treat this as a mutation.
      // We don't know which Elements were newly added/removed, but that should be okay in this case.
      // It would only impact the search state, which is unlikely to exist yet at this point.
      setRerender({})
    }

    store.addListener('mutated', handleStoreMutated)

    return () => store.removeListener('mutated', handleStoreMutated)
  }, [initialRevision, store])
  const [flatTree, setFlatTree] = useState<Element[] | undefined>()
  useEffect(() => {
    if (!store || !bridge) {
      return
    }
    ;(async () => {
      const results = await Promise.all(
        times(store.numElements)
          .map((v) => store.getElementAtIndex(v))
          .map(async (v) => {
            if (!v) return

            // const inspected = await inspectElement({ bridge, store, id: v.id })
            // if (inspected?.type === 'full-data') {
            //   return { ...v, inspected: inspected.value }
            // } else {
            return v
            // }
          })
      )

      setFlatTree(results.filter(isDefined))
    })()
  }, [bridge, rerender, store])
  const { clearHighlightNativeElement, highlightNativeElement } = useHighlightNativeElement()

  const selectedFiberId = useIframeStore((v) => v.selectedFiberId)
  const ref = useRef<VirtuosoHandle>(null)
  useEffect(() => {
    if (selectedFiberId) {
      const index = flatTree?.findIndex((v) => v.id === selectedFiberId)
      if (index && index > -1) {
        ref.current?.scrollIntoView({ index, align: 'center' })
      }
    }
  }, [flatTree, selectedFiberId])

  if (!store || !flatTree) return null

  return (
    <Box
      onMouseEnter={() => {}}
      onMouseLeave={() => {
        clearHighlightNativeElement()
      }}
    >
      <Virtuoso
        ref={ref}
        style={{ height: '100%' }}
        totalCount={flatTree?.length}
        itemContent={(i) => {
          const element = flatTree[i]
          if (!store || !element) return <Box height={'16px'}></Box>
          return <Item element={element} />
        }}
      />
    </Box>
  )
}

const NoItem = ({ element }: { element: Element }) => {
  const { depth, displayName, id } = element
  return (
    <Box
      sx={{
        marginLeft: `${depth * 4}px`,
        opacity: 0.5,
        fontSize: 'small',
      }}
    >
      {displayName}
    </Box>
  )
}

const Item = ({ element }: { element: Element }) => {
  const bridge = useBridge()
  const store = useStore()
  const selectedFiberId = useIframeStore((v) => v.selectedFiberId)
  const { depth, displayName, id } = element
  const inspected = useInspectElement(id)
  const { clearHighlightNativeElement, highlightNativeElement } = useHighlightNativeElement()
  const isSelected = selectedFiberId === id
  if (isSelected) {
    console.log(inspected)
  }
  return (
    <Box
      sx={({ palette }) => ({
        cursor: 'pointer',
        fontWeight: 500,
        opacity: inspected && !inspected.source ? 0.5 : 1,
        // display: 'inline-flex',
        padding: '4px',
        paddingLeft: `${depth * 4}px`,
        // border: '1px solid',
        background: isSelected ? lighten(palette.secondary.light, 0.7) : 'transparent',
        '&:hover': {
          background: palette.grey[300],
        },
      })}
      // onClick={() => {
      //   useDevtoolsStore.setState({ selectedNode: v })
      // }}
      onMouseEnter={() => {
        highlightNativeElement(id)
      }}
      // onMouseLeave={() => {
      //   useDevtoolsStore.setState({ highlightedNode: undefined })
      // }}
      onClick={() => {
        bridge.emit('selectFiber', id)
        // bridge.send('selectFiber', id)
      }}
    >
      {displayName}
    </Box>
  )
}
