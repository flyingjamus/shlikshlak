import { Remote, wrap } from 'comlink'
import { useIframeStore } from './Components/store'
import { ServiceWorkerAPI } from './Shared/serviceWorkerAPI'

async function initComlink() {
  const { port1, port2 } = new MessageChannel()
  const msg = {
    comlinkInit: true,
    port: port1,
  }
  navigator.serviceWorker.controller?.postMessage(msg, [port1])

  const swProxy: Remote<ServiceWorkerAPI> = wrap<ServiceWorkerAPI>(port2)
  useIframeStore.setState({ swProxy })
}

if (navigator.serviceWorker.controller) {
  initComlink()
}
navigator.serviceWorker.addEventListener('controllerchange', initComlink)

