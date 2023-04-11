import { Box, styled } from '@mui/material'
import {
  ForwardedRef,
  forwardRef,
  IframeHTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import { connectToChild } from 'penpal'
import { useIframeStore } from '../store'
import type { DevtoolsMethods } from '../../Devtools/Devtools'
import { InspectHostNodesToggle } from './InspectHostNodesToggle'
import { createBridge, createStore } from '../ReactDevtools/react-devtools-inline/frontend'
import Store from '../ReactDevtools/react-devtools-shared/src/devtools/store'
import { FrontendBridge } from '../ReactDevtools/react-devtools-shared/src/bridge'
import AutoSizer, { Size } from 'react-virtualized-auto-sizer'

const StyledIframe = styled('iframe')({
  border: '0',
  outline: '0',
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
  const refCallBack = useCallback((current?: HTMLIFrameElement | null) => {
    if (current) {
      const { bridge, store } = initialize(current.contentWindow as Window)
      useIframeStore.setState({ bridge, store })
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
        })
      })
    }
  }, [])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ flexShrink: 0 }}>
        <InspectHostNodesToggle />
      </Box>
      <Box sx={{ background: 'white', position: 'relative', flex: 1 }}>
        <AutoSizer style={{ width: '100%', height: '100%' }}>
          {(size) => (
            <ZoomedIframe
              zoom={'NONE'}
              key={'iframe'}
              // src={ready ? '/stories/example--story-root' : undefined}
              src={'http://localhost:3002'}
              // src={'http://localhost:3000/stories/json-prop-editor--arrow-function'}
              // src={'http://localhost:3000/stories/props-editor--one'}
              onLoad={() => {}}
              ref={refCallBack}
              {...size}
            />
          )}
        </AutoSizer>
      </Box>
    </Box>
  )
}

const VIEWPORT_WIDTH = 1600
const VIEWPORT_HEIGHT = 1000

const ZoomedIframe = forwardRef(
  (
    {
      width,
      height,
      zoom,
      ...props
    }: { zoom: 'FIT' | 'NONE' } & Size & IframeHTMLAttributes<HTMLIFrameElement>,
    ref: ForwardedRef<HTMLIFrameElement>
  ) => {
    const scaleX = width / VIEWPORT_WIDTH
    const scaleY = height / VIEWPORT_HEIGHT
    return (
      <Box sx={{ width: '100%', height: '100%', overflow: 'auto' }}>
        <StyledIframe
          key={'iframe'}
          sx={useMemo(
            () =>
              zoom === 'FIT'
                ? {
                    height: `${VIEWPORT_HEIGHT}px`,
                    width: `${VIEWPORT_WIDTH}px`,
                    transform: `scale(${scaleX})`,
                    transformOrigin: 'top left',
                  }
                : {
                    height: `${VIEWPORT_HEIGHT}px`,
                    width: `${VIEWPORT_WIDTH}px`,
                  },
            [scaleX, zoom]
          )}
          ref={ref}
          {...props}
        />
      </Box>
    )
  }
)
