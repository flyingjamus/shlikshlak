import { Box, styled } from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import { connectToChild } from 'penpal'
import { Methods } from './xebug/lib/methods'
import { useFileStore, useIframeStore } from '../store'
import { ProtocolDispatchers } from '../../types/protocol-proxy-api'
import { Protocol } from 'devtools-protocol/types/protocol'
import { CodeInfo } from '../ReactDevInspectorUtils/inspect'
import { throttle } from 'lodash-es'
import { DevtoolsMethods } from '../../StorybookFrame/Devtools'

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
  setReactFileLocation({ absolutePath, lineNumber, columnNumber }: CodeInfo) {
    if (absolutePath) {
      useIframeStore.setState({
        openFile: {
          path: absolutePath.slice('/home/danny/dev/shlikshlak'.length),
          lineNumber: +lineNumber,
          columnNumber: +columnNumber,
        },
      })
    } else {
      useIframeStore.setState({ openFile: undefined })
    }
  },
}

export type ParentMethods = typeof parentMethods

function getRelativeLocation(e: MouseEvent) {
  const { x, y } = e.target.getBoundingClientRect()
  const { x: parentX, y: parentY } = e.target.parentElement.getBoundingClientRect()

  const clientX = x - parentX
  const clientY = y - parentY
  return { clientX, clientY }
}

export const Preview = () => {
  // const ready = useIframeStore((v) => v.frontendReady)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [ready, setReady] = useState(false)
  const childConnection = useIframeStore((v) => v.childConnection)
  useEffect(() => {
    if (iframeRef.current && !childConnection) {
      console.debug('Connecting to child')
      const connection = connectToChild<DevtoolsMethods>({
        iframe: iframeRef.current,
        methods: parentMethods,
        childOrigin: '*',
      })
      setReady(true)

      connection.promise.then(async (childConnection) => {
        console.debug('Connected')
        await childConnection.init()
        useIframeStore.setState({
          childConnection: childConnection,
        })
      })
      return () => {}
    }
  }, [childConnection])

  const onMouseMove = useMemo(
    () =>
      throttle(async (e) => {
        const { clientX, clientY } = getRelativeLocation(e)

        console.log(
          await childConnection?.highlightPoint({
            clientX: clientX,
            clientY: clientY,
          })
        )
      }),
    []
  )

  const onClick = useMemo(
    () => async (e: MouseEvent) => {
      const { clientY, clientX } = getRelativeLocation(e)
      try {
      await childConnection?.getCodeInfoFromPoint({
        clientX,
        clientY,
      })

      } catch (e) {
        console.error(e, 13213)
      }
    },
    [childConnection]
  )
  return (
    <Box sx={{ background: 'white', position: 'relative' }}>
      {/*<Box*/}
      {/*  // onMouseMove={onMouseMove}*/}
      {/*  onClick={onClick}*/}
      {/*  sx={{ position: 'absolute', width: '100%', height: '100%', left: 0, top: 0 }}*/}
      {/*/>*/}
      <StyledIframe
        src={
          // ready ? 'http://localhost:6006/iframe.html?viewMode=story&id=example-page--logged-out' : undefined
          // ready ? 'http://localhost:6006/iframe.html?viewMode=story&id=example-header--logged-in' : undefined
          ready ? 'http://localhost:3002' : undefined
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
