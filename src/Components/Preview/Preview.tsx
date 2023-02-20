import { Box, styled } from '@mui/material'
import { useEffect, useRef } from 'react'
import { connectToChild } from 'penpal'
import { useIframeStore } from '../store'
import type { DevtoolsMethods } from '../../Devtools/Devtools'
import { InspectHostNodesToggle } from './InspectHostNodesToggle'
import { createBridge, createStore } from '../ReactDevtools/react-devtools-inline/frontend'
import Store from '../ReactDevtools/react-devtools-shared/src/devtools/store'
import { FrontendBridge } from '../ReactDevtools/react-devtools-shared/src/bridge'

const StyledIframe = styled('iframe')({
  border: '0',
  outline: '0',
  width: '100%',
  height: '100%',
  minHeight: '160px',
  maxHeight: '2000px',
  flex: 1,
})

export const parentMethods = {}

export type ParentMethods = typeof parentMethods

export function initialize(
  contentWindow: Window,
  {
    bridge,
    store,
  }: {
    bridge?: FrontendBridge
    store?: Store
  } = {}
) {
  if (bridge == null) {
    bridge = createBridge(contentWindow)
  }

  // Type refinement.
  const frontendBridge = bridge as any as FrontendBridge

  if (store == null) {
    store = createStore(frontendBridge)
  }

  const onGetSavedPreferences = () => {
    frontendBridge.removeListener('getSavedPreferences', onGetSavedPreferences)
    frontendBridge.send('savedPreferences', {
      appendComponentStack: false,
      breakOnConsoleErrors: false,
      componentFilters: [],
      showInlineWarningsAndErrors: true,
      hideConsoleLogsInStrictMode: false,
    })
  }

  frontendBridge.addListener('getSavedPreferences', onGetSavedPreferences)

  return { bridge, store }
}

export const Preview = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const childConnection = useIframeStore((v) => v.childConnection)

  useEffect(() => {
    const current = iframeRef.current
    if (current && !childConnection) {
      const { bridge, store } = initialize(current.contentWindow as Window)
      console.debug('Connecting to child', bridge, store)
      const connection = connectToChild<DevtoolsMethods>({
        iframe: current,
        methods: parentMethods,
        childOrigin: '*',
      })
      connection.promise.then(async (childConnection) => {
        console.debug('Connected to child')
        await childConnection.init()
        useIframeStore.setState({
          childConnection: childConnection,
          bridge,
          store,
        })
      })
      return () => {}
    }
  }, [childConnection])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ flexShrink: 0 }}>
        <InspectHostNodesToggle />
      </Box>
      <Box sx={{ background: 'white', position: 'relative', flex: 1 }}>
        <StyledIframe
          // src={ready ? '/stories/example--story-root' : undefined}
          src={'http://localhost:3002'}
          // src={ready ? '/stories/example-thin--story-root' : undefined}
          onLoad={() => {}}
          ref={iframeRef}
        />
      </Box>
    </Box>
  )
}
