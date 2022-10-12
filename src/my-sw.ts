import { clientsClaim } from 'workbox-core'
import { expose } from 'comlink'
import { FilesMap, FileStoreState, useFileStore } from './Components/store'
import { registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate, CacheFirst, Strategy, StrategyHandler } from 'workbox-strategies'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

self.__WB_DISABLE_DEV_LOGS = true

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

class CustomStrategy extends Strategy {
  async _handle(request: Request, handler: StrategyHandler) {
    console.log(request.url, 'strategy')
    const cacheMatch = await handler.cacheMatch(request)
    if (cacheMatch) {
      console.log('cahcematch', request.url)
      return cacheMatch
    }
    const response = await handler.fetch(request)
    console.log('cahceput', request.url)
    await handler.cachePut(request, response)
    return response

    // const cacheMatchDone = handler.cacheMatch(request)
    //
    // return new Promise((resolve, reject) => {
    //   fetchAndCachePutDone.then(resolve)
    //   cacheMatchDone.then((response) => response && resolve(response))
    //
    //   // Reject if both network and cache error or find no response.
    //   Promise.allSettled([fetchAndCachePutDone, cacheMatchDone]).then((results) => {
    //     const [fetchAndCachePutResult, cacheMatchResult] = results
    //     if (fetchAndCachePutResult.status === 'rejected' && !cacheMatchResult.value) {
    //       reject(fetchAndCachePutResult.reason)
    //     }
    //   })
    // })
  }
}

registerRoute(
  ({ url }) => url.host === 'localhost:3001' && url.pathname.includes('node_modules'),
  new CacheFirst({
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200, 204],
      }),
    ],
  })
)
