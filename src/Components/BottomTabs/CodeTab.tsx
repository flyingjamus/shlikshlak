import { Box } from '@mui/material'

import { WrappedMonacoEditor } from '../Editor/WrappedMonacoEditor'

export const CodeTab = () => {
  return (
    <Box sx={{ height: '100%' }}>
      <WrappedMonacoEditor key={'editor'} />
    </Box>
  )
}
