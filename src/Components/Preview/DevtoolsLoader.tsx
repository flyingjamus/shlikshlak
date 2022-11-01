import { initialize, activate } from '../ReactDevtools/react-devtools-inline/backend'

;(async () => {
  initialize(window)
  activate(window)
})()
