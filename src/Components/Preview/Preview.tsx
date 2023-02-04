import { Box, styled } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { connectToChild } from 'penpal'
import { useIframeStore } from '../store'
import type { DevtoolsMethods } from '../../Devtools/Devtools'
import { IRange } from 'monaco-editor-core'
import { getTypescriptWorker } from '../../tsworker/GetTypescriptWorker'
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

export const parentMethods = {}

export type ParentMethods = typeof parentMethods

export const Preview = () => {
  // const ready = useIframeStore((v) => v.frontendReady)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [ready, setReady] = useState(false)
  const childConnection = useIframeStore((v) => v.childConnection)

  useEffect(() => {
    const current = iframeRef.current
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
        await childConnection.init()
        useIframeStore.setState({
          childConnection: childConnection,
        })
      })
      return () => {
      }
    }
  }, [childConnection])

  return (
    <Box sx={{ background: 'white', position: 'relative' }}>
      <DevtoolsOverlay />
      <StyledIframe
        // src={ready ? '/stories/example--story-root' : undefined}
        src={ready ? 'http://localhost:3002/login' : undefined}
        // src={ready ? '/stories/example-thin--story-root' : undefined}
        onLoad={() => {}}
        ref={iframeRef}
      />
    </Box>
  )
}
