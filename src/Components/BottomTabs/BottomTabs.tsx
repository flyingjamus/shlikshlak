import { SyntheticEvent, useState } from 'react'
import { Box, Paper, Tab, Tabs, Typography } from '@mui/material'
import { CodeTab } from './CodeTab'
import { useIframeStore } from '../store'

export function BottomTabs() {
  const [tabValue, setTabValue] = useState<number>(0)

  const handleTabChange = (event: SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        indicatorColor="primary"
        textColor="primary"
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          borderBottom: '1px solid divider',
          background: 'white',
          minHeight: 0,
          flexShrink: 0,
          '& .MuiTabs-flexContainer': {
            gap: '8px',
          },
          '& .MuiTab-root': {
            fontSize: '12px',
            minHeight: 0,
            textTransform: 'none',
            minWidth: 0,
            padding: '6px 10px ',
            '&:last-child': {
              marginRight: 0,
            },
          },
        }}
      >
        <Tab label="Code" />
      </Tabs>
      <Paper sx={{ borderRadius: '0 4px 4px 0', padding: 2, flex: 1, overflow: 'hidden' }}>
        {tabValue === 0 && <CodeTab key={'codetab'} />}
      </Paper>
    </Box>
  )
}
export const A = () => {
  const fileName = useIframeStore((v) => v.selectedFiberSource?.fileName)
  return (
    <Box>
      <Typography variant={'caption'}>{fileName}</Typography>
    </Box>
  )
}
