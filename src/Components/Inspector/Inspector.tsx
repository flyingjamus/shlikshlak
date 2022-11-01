import { useIframeStore } from '../store'
import { FunctionComponent, useEffect, useState } from 'react'
import { initialize } from '../ReactDevtools/react-devtools-inline/frontend'

export const Inspector = () => {
  const iframe = useIframeStore((v) => v.iframe)
  console.log(iframe)
  const [DevTools, setDevTools] = useState<FunctionComponent<{}> | null>(null)
  useEffect(() => {
    console.log(iframe)
    if (iframe?.contentWindow) {
      setDevTools(initialize(iframe?.contentWindow))
      useIframeStore.setState({ frontendReady: true })
    }
  }, [iframe])

  return DevTools ? <DevTools /> : null
}
