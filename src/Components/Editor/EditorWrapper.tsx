import { useIframeStore } from '../store'
import MonacoEditor from './MonacoEditor'

export const EditorWrapper = () => {
  const tsInit = useIframeStore((v) => v.tsInit)
  // return tsInit ? <MonacoEditor /> : null
  return <MonacoEditor />
}
