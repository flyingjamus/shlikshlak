import { Box, styled } from '@mui/material'
import React, {
  ForwardedRef,
  forwardRef,
  IframeHTMLAttributes,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
} from 'react'
import { connectToChild } from 'penpal'
import { useIframeStore } from '../store'
import type { DevtoolsMethods } from '../../Devtools/Devtools'
import { InspectHostNodesToggle } from './InspectHostNodesToggle'
import { createBridge, createStore } from '../ReactDevtools/react-devtools-inline/frontend'
import { animated, useSpring } from '@react-spring/web'
import { createUseGesture, dragAction, pinchAction } from '@use-gesture/react'

const StyledIframe = styled('iframe')({
  border: '0',
  outline: '0',
})


const AnimatedBox = animated(Box)
export const parentMethods = {}

export type ParentMethods = typeof parentMethods

export function initialize(contentWindow: Window) {
  const bridge = createBridge(contentWindow)
  const store = createStore(bridge)

  const onGetSavedPreferences = () => {
    bridge.removeListener('getSavedPreferences', onGetSavedPreferences)
    bridge.send('savedPreferences', {
      appendComponentStack: false,
      breakOnConsoleErrors: false,
      componentFilters: [],
      showInlineWarningsAndErrors: true,
      hideConsoleLogsInStrictMode: false,
    })
  }

  bridge.addListener('getSavedPreferences', onGetSavedPreferences)

  return { bridge, store }
}

export const Preview = () => {
  const iframeRef = useRef<HTMLIFrameElement>()
  const refCallBack = useCallback((current?: HTMLIFrameElement | null) => {
    if (iframeRef.current == current) return
    if (current) {
      iframeRef.current = current
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

        bridge.addListener('ctrlPressed', (pressed) => {
          useIframeStore.setState({ ctrlPressed: pressed })
        })

        window.addEventListener('keydown', (e) => {
          if (e.key === 'Control' || e.key === 'Meta') {
            useIframeStore.setState({ ctrlPressed: true })
          }
        })
        window.addEventListener('keyup', (e) => {
          if (e.key === 'Control' || e.key === 'Meta') {
            useIframeStore.setState({ ctrlPressed: false })
          }
        })
      })
    }
  }, [])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ flexShrink: 0 }}>
        <InspectHostNodesToggle />
      </Box>
      <Box sx={{ background: 'white', position: 'relative', flex: 1, overflow: 'hidden' }}>
        <ZoomedIframe
          key={'iframe'}
          // src={ready ? '/stories/example--story-root' : undefined}
          src={'http://localhost:3002'}
          // src={'http://localhost:3002/stories/json-prop-editor--arrow-function'}
          // src={ready ? '/stories/example-thin--story-root' : undefined}
          onLoad={() => {}}
          ref={refCallBack}
        />
      </Box>
    </Box>
  )
}

const VIEWPORT_WIDTH = 1600
const VIEWPORT_HEIGHT = 1000

const ZoomedIframe = forwardRef(
  (props: IframeHTMLAttributes<HTMLIFrameElement>, inputRef: ForwardedRef<HTMLIFrameElement>) => {
    const ctrlPressed = useIframeStore((v) => v.ctrlPressed)
    return (
      <ZoomableBox>
        <StyledIframe
          key={'iframe'}
          sx={{
            height: `${VIEWPORT_HEIGHT}px`,
            width: `${VIEWPORT_WIDTH}px`,
          }}
          ref={inputRef}
          {...props}
        />

        {ctrlPressed ? (
          <Box
            sx={{
              height: `${VIEWPORT_HEIGHT}px`,
              width: `${VIEWPORT_WIDTH}px`,
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 100,
            }}
          ></Box>
        ) : null}
      </ZoomableBox>
    )
  }
)

const useGesture = createUseGesture([dragAction, pinchAction])

const ZoomableBox = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    const handler = (e: Event) => e.preventDefault()
    document.addEventListener('gesturestart', handler)
    document.addEventListener('gesturechange', handler)
    document.addEventListener('gestureend', handler)
    return () => {
      document.removeEventListener('gesturestart', handler)
      document.removeEventListener('gesturechange', handler)
      document.removeEventListener('gestureend', handler)
    }
  }, [])

  const [style, api] = useSpring(() => ({
    x: 0,
    y: 0,
    scale: 1,
    rotateZ: 0,
    config: {
      friction: 10,
      clamp: true,
      duration: 50,
    },
  }))
  const ref = React.useRef<HTMLDivElement>(null)

  useGesture(
    {
      onDrag: ({ pinching, cancel, offset: [x, y], ...rest }) => {
        if (pinching) return cancel()
        // api.start({ x: clamp(x, -width, width / 4), y: clamp(y, -height / 2, height / 2) })
        api.start({ x, y })
      },
      onPinch: ({ origin: [ox, oy], first, movement: [ms], offset: [s, a], memo }) => {
        if (first) {
          const { width, height, x, y } = ref.current!.getBoundingClientRect()
          const tx = ox - (x + width / 2)
          const ty = oy - (y + height / 2)
          memo = [style.x.get(), style.y.get(), tx, ty]
        }

        const x = memo[0] - (ms - 1) * memo[2]
        const y = memo[1] - (ms - 1) * memo[3]
        api.start({ scale: s, rotateZ: a, x, y })
        return memo
      },
    },
    {
      target: ref,
      drag: {
        from: () => [style.x.get(), style.y.get()],
      },
      pinch: { scaleBounds: { min: 0.2, max: 5 }, rubberband: false },
    }
  )

  return (
    <Box
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}
    >
      <AnimatedBox sx={{}} style={style} ref={ref}>
        {children}
      </AnimatedBox>
    </Box>
  )
}
