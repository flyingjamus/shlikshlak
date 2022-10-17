import { Box } from '@mui/material'
import { useFileStore } from '../store'

export const PropsEditor = () => {
  const panels = useFileStore((v) => v.panels)
  console.log(panels)
  return (
    <Box>
      {panels?.existingAttributes
        .map((v) => ({ ...v, panels: panels.attributes.find((a) => a.name === v.name)?.panels }))
        .map((v) => (
          <Box>
            <Box>{v.name}</Box>
            {v.value}
          </Box>
        ))}
    </Box>
  )
}
