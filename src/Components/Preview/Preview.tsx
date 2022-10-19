import { Box, styled } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { connectToChild } from 'penpal'
import { Methods } from './xebug/lib/methods'
import { useFileStore, useIframeStore } from '../store'
import { ProtocolDispatchers } from '../../types/protocol-proxy-api'
import { Protocol } from 'devtools-protocol/types/protocol'
import { CodeInfo } from '../ReactDevInspectorUtils/inspect'

const StyledIframe = styled('iframe')({
  border: '0',
  outline: '0',
  width: '100%',
  height: '100%',
  minHeight: '160px',
  maxHeight: '2000px',
  flex: 1,
})

const flattenTree = (nodes: Protocol.DOM.Node[]): Protocol.DOM.Node[] => {
  return nodes.flatMap((node) => [node, ...((node.children && flattenTree(node.children)) || [])])
}

export const parentMethods = {
  ...({
    DOM: {
      setChildNodes(params: Protocol.DOM.SetChildNodesEvent) {
        const rootNode = useIframeStore.getState().rootNode
        if (params.parentId === rootNode?.nodeId) {
          useIframeStore.setState({
            rootNode: { ...rootNode, children: params.nodes },
            nodesMap: new Map(flattenTree([rootNode, ...params.nodes]).map((v) => [v.nodeId, v])),
          })
        } else {
          console.error('Got child nodes for expected node ' + params.parentId)
        }
      },
      childNodeInserted({ node, parentNodeId, previousNodeId }: Protocol.DOM.ChildNodeInsertedEvent) {
        const nodesMap = new Map(useIframeStore.getState().nodesMap)
        const parent = nodesMap?.get(parentNodeId)
        const prev = nodesMap?.get(previousNodeId)
        if (!parent) throw new Error('No parent')

        const children = parent.children || []
        children.splice(prev ? children.indexOf(prev) + 1 : 0, 0, node)
        nodesMap.set(node.nodeId, node)
        nodesMap.set(parent.nodeId, { ...parent, childNodeCount: children.length, children })
        useIframeStore.setState({ nodesMap })
        // nodesMap.get(parentNodeId)
      },
    },
    Overlay: {
      inspectNodeRequested({ backendNodeId }: Protocol.Overlay.InspectNodeRequestedEvent) {
        const nodesMap = useIframeStore.getState().nodesMap
        nodesMap?.get(backendNodeId)
      },
    },
  } as ProtocolDispatchers),
  setReactFileLocation(nodeId: number, location: CodeInfo) {
    useIframeStore.setState({ openFile: location })
  },
}

export const Preview = () => {
  // const ready = useIframeStore((v) => v.frontendReady)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [ready, setReady] = useState(false)
  const childConnection = useIframeStore((v) => v.childConnection)
  useEffect(() => {
    if (iframeRef.current && !childConnection) {
      const connection = connectToChild<Methods>({
        iframe: iframeRef.current,
        methods: parentMethods,
        childOrigin: '*',
      })
      setReady(true)

      console.debug('Connecting to child')
      connection.promise.then(async (child) => {
        child.DOM.enable()
        console.debug('Connected')
        const elementsTree = await child.DOM.getDocument()
        useIframeStore.setState({ childConnection: child, rootNode: elementsTree.root })
        await child.DOM.requestChildNodes({ nodeId: elementsTree.root.nodeId, depth: 1000 })
      })
      return () => {
        // useIframeStore.setState({ childConnection: undefined, rootNode: undefined })
        // setReady(false)
        // return connection.destroy()
      }
    }
  }, [])

  return (
    <Box sx={{ background: 'white' }}>
      <StyledIframe
        src={
          // ready ? 'http://localhost:6006/iframe.html?viewMode=story&id=example-page--logged-out' : undefined
          ready ? 'http://localhost:6006/iframe.html?viewMode=story&id=example-header--logged-in' : undefined
        }
        onLoad={() => {
          // console.log(useIframeStore.getState().childConnection)
        }}
        // src={'http://localhost:6006/iframe.html?viewMode=story&id=example-page--logged-out'}
        ref={iframeRef}
      />
    </Box>
  )
}
