import { clientsClaim } from 'workbox-core'
import { expose } from 'comlink'
import { FilesMap, FileStoreState, useFileStore } from './Components/store'
import { registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate } from 'workbox-strategies'

self.__WB_DISABLE_DEV_LOGS = true;

declare let self: ServiceWorkerGlobalScope

self.skipWaiting()
clientsClaim()

type ReadFile = FileStoreState['readFile']

let readFile: ReadFile | undefined
export const workerAPI = {
  init: (v: FileStoreState) => {
    readFile = v.readFile
  },
}

self.addEventListener('message', (event) => {
  if (event.data.comlinkInit) {
    expose(workerAPI, event.data.port)
    return
  }
})

registerRoute(
  ({ url }) => url.host === 'localhost:3001' && url.pathname.includes('node_modules'),
  new StaleWhileRevalidate()
)
