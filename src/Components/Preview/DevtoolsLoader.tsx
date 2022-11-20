import { initialize } from '../ReactDevtools/react-devtools-inline/backend'

window.__DEV__ = false
console.log('Initing devtools')
initialize(window)
