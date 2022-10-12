import { Box } from '@mui/material'
import { useFileStore } from '../store'
import MonacoEditor from './MonacoEditor'

export const EditorWrapper = () => {
  return <MonacoEditor />
  // const readFile = useFileStore((v) => v.readFile)
  // return readFile ? <MonacoEditor /> : null
}
