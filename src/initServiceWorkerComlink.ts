import { Remote, wrap } from 'comlink'
import { useFileStore, useIframeStore } from './Components/store'
import { WorkerAPI } from './Shared/workerAPI'

async function initComlink() {
  const { port1, port2 } = new MessageChannel()
  const msg = {
    comlinkInit: true,
    port: port1,
  }
  navigator.serviceWorker.controller?.postMessage(msg, [port1])

  const swProxy: Remote<WorkerAPI> = wrap<WorkerAPI>(port2)
  useIframeStore.setState({ swProxy })
}

if (navigator.serviceWorker.controller) {
  initComlink()
}
navigator.serviceWorker.addEventListener('controllerchange', initComlink)

