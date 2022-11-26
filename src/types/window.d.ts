import { DevToolsHook } from '../Components/ReactDevtools/react-devtools-shared/src/backend/types'

declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__: DevToolsHook
  }
}
