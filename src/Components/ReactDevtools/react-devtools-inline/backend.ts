import Agent from '../react-devtools-shared/src/backend/agent'
import Bridge from '../react-devtools-shared/src/bridge'
import { initBackend } from '../react-devtools-shared/src/backend'
import { installHook } from '../react-devtools-shared/src/hook'
import setupNativeStyleEditor from '../react-devtools-shared/src/backend/NativeStyleEditor/setupNativeStyleEditor'
import { BackendBridge } from '../react-devtools-shared/src/bridge'
import { Wall } from '../react-devtools-shared/src/types'

function startActivation(contentWindow: Window, bridge: BackendBridge) {
  finishActivation(contentWindow, bridge)
}

function finishActivation(contentWindow: Window, bridge: BackendBridge) {
  const agent = new Agent(bridge)
  const hook = contentWindow.__REACT_DEVTOOLS_GLOBAL_HOOK__

  if (hook) {
    initBackend(hook, agent, contentWindow)

    // Setup React Native style editor if a renderer like react-native-web has injected it.
    if (hook.resolveRNStyle) {
      setupNativeStyleEditor(bridge, agent, hook.resolveRNStyle, hook.nativeStyleEditorValidAttributes)
    }
  }
}

export function activate(
  contentWindow: window,
  {
    bridge,
  }: {
    bridge?: BackendBridge
  } = {}
): void {
  if (bridge == null) {
    bridge = createBridge(contentWindow)
  }

  startActivation(contentWindow, bridge)
}
export function createBridge(contentWindow: window, wall?: Wall): BackendBridge {
  const { parent } = contentWindow

  if (wall == null) {
    wall = {
      listen(fn) {
        const onMessage = ({ data }) => {
          fn(data)
        }

        contentWindow.addEventListener('message', onMessage)
        return () => {
          contentWindow.removeEventListener('message', onMessage)
        }
      },

      send(event: string, payload: any, transferable?: Array<any>) {
        parent.postMessage(
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

  return new Bridge(wall) as BackendBridge
}
export function initialize(contentWindow: typeof window): void {
  installHook(contentWindow)
}
