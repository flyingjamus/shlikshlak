import { Box, styled } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { connectToChild } from 'penpal'
import { useIframeStore } from '../store'
import type { DevtoolsMethods } from '../../Devtools/Devtools'
import { IRange } from 'monaco-editor-core'
import { getTypescriptWorker } from '../../tsworker/GetTypescriptWorker'
import { createBridge, createStore } from '../ReactDevtools/react-devtools-inline/frontend'
import { DevtoolsOverlay } from '../../Devtools/DevtoolsOverlay'

const StyledIframe = styled('iframe')({
  border: '0',
  outline: '0',
  width: '100%',
  height: '100%',
  minHeight: '160px',
  maxHeight: '2000px',
  flex: 1,
})

// const flattenTree = (nodes: Protocol.DOM.Node[]): Protocol.DOM.Node[] => {
//   return nodes.flatMap((node) => [node, ...((node.children && flattenTree(node.children)) || [])])
// }

export const parentMethods = {
  DOM: {
    // setChildNodes(params: Protocol.DOM.SetChildNodesEvent) {
    //   const rootNode = useIframeStore.getState().rootNode
    //   if (params.parentId === rootNode?.nodeId) {
    //     useIframeStore.setState({
    //       rootNode: { ...rootNode, children: params.nodes },
    //       nodesMap: new Map(flattenTree([rootNode, ...params.nodes]).map((v) => [v.nodeId, v])),
    //     })
    //   } else {
    //     console.error('Got child nodes for expected node ' + params.parentId)
    //   }
    // },
    // childNodeInserted({ node, parentNodeId, previousNodeId }: Protocol.DOM.ChildNodeInsertedEvent) {
    //   const nodesMap = new Map(useIframeStore.getState().nodesMap)
    //   const parent = nodesMap?.get(parentNodeId)
    //   const prev = nodesMap?.get(previousNodeId)
    //   if (!parent) throw new Error('No parent')
    //
    //   const children = parent.children || []
    //   children.splice(prev ? children.indexOf(prev) + 1 : 0, 0, node)
    //   nodesMap.set(node.nodeId, node)
    //   nodesMap.set(parent.nodeId, { ...parent, childNodeCount: children.length, children })
    //   useIframeStore.setState({ nodesMap })
    //   // nodesMap.get(parentNodeId)
    // },
  },
  Overlay: {
    // inspectNodeRequested({ backendNodeId }: Protocol.Overlay.InspectNodeRequestedEvent) {
    //   const nodesMap = useIframeStore.getState().nodesMap
    //   nodesMap?.get(backendNodeId)
    // },
  },
  async setHighlight({ absolutePath, range }: { absolutePath: string; range: IRange }) {
    const editor = useIframeStore.getState().getEditor()
    const tsWorker = await getTypescriptWorker()

    useIframeStore.setState({ openFile: undefined })
  },
}

export type ParentMethods = typeof parentMethods

export const Preview = () => {
  // const ready = useIframeStore((v) => v.frontendReady)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [ready, setReady] = useState(false)
  const childConnection = useIframeStore((v) => v.childConnection)
  const store = useIframeStore((v) => v.devtoolsStore)

  // const onMouseMove = async (e: MouseEvent) => {
  //   const iframe = iframeRef.current?.parentElement
  //   if (!iframe) return
  //   const { x, y } = iframe.getBoundingClientRect()
  //   // const id = await childConnection?.idFromPoint({
  //   //   clientX: e.clientX - x,
  //   //   clientY: e.clientY - y,
  //   // })
  //   let parent = store?.getElementByID(id)
  //   while (parent) {
  //     console.log(parent, parent.parentID)
  //     parent = parent.parentID && store?.getElementByID(parent.parentID)
  //   }
  //   console.log(x, y, id, store?.getElementByID(id))
  // }

  useEffect(() => {
    const current = iframeRef.current
    // current.addEventListener('mousemove', onMouseMove)
    if (current && !childConnection) {
      console.debug('Connecting to child')
      const connection = connectToChild<DevtoolsMethods>({
        iframe: current,
        methods: parentMethods,
        childOrigin: '*',
      })

      setReady(true)

      connection.promise.then(async (childConnection) => {
        console.debug('Connected to child')
        const bridge = createBridge(window)
        const store = createStore(bridge)
        await childConnection.init()
        useIframeStore.setState({
          childConnection: childConnection,
          devtoolsBridge: bridge,
          devtoolsStore: store,
        })
      })
      return () => {
        // current.removeEventListener('mousemove', onMouseMove)
      }
    }
  }, [childConnection])

  return (
    <Box sx={{ background: 'white', position: 'relative' }}>
      <DevtoolsOverlay />
      <StyledIframe
        src={ready ? '/stories/example--story-root' : undefined}
        // src={ready ? '/stories/example-thin--story-root' : undefined}
        onLoad={() => {}}
        ref={iframeRef}
      />
    </Box>
  )
}
