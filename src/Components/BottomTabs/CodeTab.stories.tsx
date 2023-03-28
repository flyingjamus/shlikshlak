import { Box } from '@mui/material'
import { useIframeStore } from '../store'
import { WrappedMonacoEditor } from '../Editor/WrappedMonacoEditor'

useIframeStore.setState({
  selectedFiberSource: {
    fileName: '/home/danny/dev/shlikshlak/src/Components/PropsEditor/PropsEditor.tsx',
    lineNumber: 381,
    columnNumber: 10,
  },
})

export const TsLanguageClient = () => {
  return (
    <Box height={'400px'}>
      <WrappedMonacoEditor />
    </Box>
  )
}
