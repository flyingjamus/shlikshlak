import { useIframeStore } from '../store'
import { Box, Stack } from '@mui/material'

export const ElementsStack = () => {
  const stack = useIframeStore((v) => v.elementsStack)
  if (!stack) return null
  return (
    <Stack>
      {stack.map((v) => (
        <Box key={v.id}>{v.displayName}</Box>
      ))}
    </Stack>
  )
}
