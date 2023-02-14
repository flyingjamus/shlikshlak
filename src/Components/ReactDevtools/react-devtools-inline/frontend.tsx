import * as React from 'react'
import type { FrontendBridge } from '../react-devtools-shared/src/bridge'
import Bridge from '../react-devtools-shared/src/bridge'
import Store from '../react-devtools-shared/src/devtools/store'
import type { Wall } from '../react-devtools-shared/src/types'

type Config = {
  checkBridgeProtocolCompatibility?: boolean
  supportsNativeInspection?: boolean
  supportsProfiling?: boolean
}
export function createStore(bridge: FrontendBridge, config?: Config): Store {
  return new Store(bridge, {
    checkBridgeProtocolCompatibility: true,
    supportsTraceUpdates: true,
    supportsTimeline: true,
    supportsNativeInspection: true,
    ...config,
  })
}
export function createBridge(contentWindow: Window, wall?: Wall): FrontendBridge {
  if (wall == null) {
    wall = {
      listen(fn) {
        const onMessage = ({ data }) => {
          fn(data)
        }

        window.addEventListener('message', onMessage)
        return () => {
          window.removeEventListener('message', onMessage)
        }
      },

      send(event: string, payload: any, transferable?: Array<any>) {
        contentWindow.postMessage(
          {
            event,
            payload,
          },
          '*',
          transferable
        )
      },
    }
  }

  return new Bridge(wall) as FrontendBridge
}
// export function initialize(
//   contentWindow: window,
//   {
//     bridge,
//     store,
//   }: {
//     bridge?: FrontendBridge
//     store?: Store
//   } = {}
// ): React.AbstractComponent<Props, unknown> {
//   if (bridge == null) {
//     bridge = createBridge(contentWindow)
//   }
//
//   // Type refinement.
//   const frontendBridge = bridge as any as FrontendBridge
//
//   if (store == null) {
//     store = createStore(frontendBridge)
//   }
//
//   const onGetSavedPreferences = () => {
//     // This is the only message we're listening for,
//     // so it's safe to cleanup after we've received it.
//     frontendBridge.removeListener('getSavedPreferences', onGetSavedPreferences)
//     const data = {
//       appendComponentStack: getAppendComponentStack(),
//       breakOnConsoleErrors: getBreakOnConsoleErrors(),
//       componentFilters: getSavedComponentFilters(),
//       showInlineWarningsAndErrors: getShowInlineWarningsAndErrors(),
//       hideConsoleLogsInStrictMode: getHideConsoleLogsInStrictMode(),
//     }
//     // The renderer interface can't read saved preferences directly,
//     // because they are stored in localStorage within the context of the extension.
//     // Instead it relies on the extension to pass them through.
//     frontendBridge.send('savedPreferences', data)
//   }
//
//   frontendBridge.addListener('getSavedPreferences', onGetSavedPreferences)
//   const ForwardRef = forwardRef<Props, unknown>((props, ref) => (
//     <DevTools ref={ref} bridge={frontendBridge} store={store} {...props} />
//   ))
//   ForwardRef.displayName = 'DevTools'
//   return ForwardRef
// }
