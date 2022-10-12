import './App.css'
import { Screen } from './Components/Screen/Screen'
import './workers'
import './initServiceWorkerComlink'
import { useIframeStore } from './Components/store'

function App() {
  // const readFile = useFileStore((v) => v.readFile)
  const swProxy = useIframeStore((v) => v.swProxy)
  // useEffect(() => {
  //   if (swProxy && readFile) {
  //     console.log(1233123, 'initing')
  //     swProxy.init(wrap(useFileStore.getState()))
  //   }
  // }, [swProxy, readFile])
  return <Screen />
}

export default App
