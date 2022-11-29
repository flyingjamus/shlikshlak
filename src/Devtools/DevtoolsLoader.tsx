import { initialize } from '../Components/ReactDevtools/react-devtools-inline/backend'
// @ts-ignore This is vite magic or something
import RefreshRuntime from '/@react-refresh'

// window.__DEV__ = false
console.log('Activating devtools', window.__REACT_DEVTOOLS_GLOBAL_HOOK__)
initialize(window)

// This fixes HMR, only in iframe ?!
RefreshRuntime.injectIntoGlobalHook(window)
