import { Box, styled } from '@mui/material'
import {
  ForwardedRef,
  forwardRef,
  IframeHTMLAttributes,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  WheelEvent,
} from 'react'
import { connectToChild } from 'penpal'
import { useIframeStore } from '../store'
import type { DevtoolsMethods } from '../../Devtools/Devtools'
import { InspectHostNodesToggle } from './InspectHostNodesToggle'
import { createBridge, createStore } from '../ReactDevtools/react-devtools-inline/frontend'
import Store from '../ReactDevtools/react-devtools-shared/src/devtools/store'
import { FrontendBridge } from '../ReactDevtools/react-devtools-shared/src/bridge'
import AutoSizer, { Size } from 'react-virtualized-auto-sizer'
import { useEventListenerRef, useMergeRefs } from 'rooks'
import { throttle } from 'lodash-es'

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
      })
    }
  }, [])

  const element = useCallback(
    (size) => (
      <ZoomedIframe
        zoom={'NONE'}
        key={'iframe'}
        // src={ready ? '/stories/example--story-root' : undefined}
        src={'http://localhost:3002'}
        // src={'http://localhost:3002/stories/json-prop-editor--arrow-function'}
        // src={ready ? '/stories/example-thin--story-root' : undefined}
        onLoad={() => {}}
        ref={refCallBack}
        {...size}
      />
    ),
    [refCallBack]
  )
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ flexShrink: 0 }}>
        <InspectHostNodesToggle />
      </Box>
      <Box sx={{ background: 'white', position: 'relative', flex: 1, overflow: 'auto' }}>
        <AutoSizer style={{ width: '100%', height: '100%' }}>{element}</AutoSizer>
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
    inputRef: ForwardedRef<HTMLIFrameElement>
  ) => {
    const scaleX = width / VIEWPORT_WIDTH
    const scaleY = height / VIEWPORT_HEIGHT
    const [scale, setScale] = useState<{ x: number; y: number; scale: number }>({
      x: 0,
      y: 0,
      scale: width / VIEWPORT_WIDTH,
    })

    const handleWheel = useMemo(() => {
      const debouncedFunc = throttle((e: WheelEvent<HTMLDivElement>) => {
        if (!useIframeStore.getState().ctrlPressed) return
        const scaleAmount = e.deltaY > 0 ? 0.9 : 1.1

        setScale(({ scale, x, y }) => {
          const touchOrigin: [touchOriginX: number, touchOriginY: number] = [e.clientX, e.clientY]

          const currentScale = scale
          const newScale = currentScale * scaleAmount
          const [newX, newY] = getTranslateOffsetsFromScale({
            scale: newScale,
            currentTranslate: [x, y],
            imageRef: ref,
            pinchDelta: newScale - currentScale,
            touchOrigin,
            currentScale,
            translateX: x,
            translateY: y,
          })

          return {
            scale: newScale,
            x: newX,
            y: newY,
          }
        })
      }, 10)
      return (e: WheelEvent<HTMLDivElement>) => {
        console.log(111111)
        e.preventDefault()
        debouncedFunc(e)
      }
    }, [])
    useEffect(() => {
      const container = ref.current
      if (container) {
        container.style.transform = `translate(${scale.x}px, ${scale.y}px) scale(${scale.scale})`
      }
    }, [scale])
    const ref = useRef<HTMLDivElement>(null)
    const scrollRef = useEventListenerRef('wheel', handleWheel as any)

    const ctrlPressed = useIframeStore((v) => v.ctrlPressed)
    return (
      <Box sx={{ width: '100%', height: '100%', position: 'relative', overflow: 'auto' }}>
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
          ref={useMergeRefs(ref, inputRef)}
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
            ref={scrollRef}
          ></Box>
        ) : null}
      </Box>
    )
  }
)

function throttleWithRequestAnimationFrame<T extends Event>(listener: EventListener) {
  let running = false

  return (event: T) => {
    if (running) return
    running = true

    requestAnimationFrame(() => {
      listener(event)
      running = false
    })
  }
}
const getTranslateOffsetsFromScale = ({
  imageRef,
  scale,
  pinchDelta,
  touchOrigin: [touchOriginX, touchOriginY],
  currentTranslate: [translateX, translateY],
}: {
  /** The current [x,y] translate values of image */
  currentTranslate: [translateX: number, translateY: number]
  imageRef: RefObject<HTMLElement>
  pinchDelta: number
  scale: number
  touchOrigin: [touchOriginX: number, touchOriginY: number]
}): [translateX: number, translateY: number] => {
  if (!imageRef?.current) {
    return [0, 0]
  }

  const {
    height: imageHeight,
    left: imageTopLeftX,
    top: imageTopLeftY,
    width: imageWidth,
  } = imageRef.current.getBoundingClientRect()

  // Get the (x,y) touch position relative to image origin at the current scale
  const imageCoordX = (touchOriginX - imageTopLeftX - imageWidth / 2) / scale
  const imageCoordY = (touchOriginY - imageTopLeftY - imageHeight / 2) / scale

  // Calculate translateX/Y offset at the next scale to zoom to touch position
  const newTranslateX = -imageCoordX * pinchDelta + translateX
  const newTranslateY = -imageCoordY * pinchDelta + translateY

  return [newTranslateX, newTranslateY]
}
