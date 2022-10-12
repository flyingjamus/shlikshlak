import { Box, ButtonBase, Stack, styled } from '@mui/material'
import { FileLoader } from '../FileLoader/FileLoader'
import { FileTree } from './FileTree'

export const Files = () => {
  return (
    <Stack direction={'column'} sx={{ overflow: 'hidden' }}>
      <Box flex={0}>
        <FileLoader />
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <FileTree />
      </Box>
    </Stack>
  )
}
