import { useCallback, useEffect, useState } from 'react'
import { useBridge } from '../PropsEditor/UseBridge'
import { ToggleButton } from '@mui/material'
import Search from '@mui/icons-material/Search'

export function InspectHostNodesToggle() {
  const [isInspecting, setIsInspecting] = useState(false)
  const bridge = useBridge()

  const handleChange = useCallback(
    (isChecked: boolean) => {
      setIsInspecting(isChecked)

      if (isChecked) {
        bridge.send('startInspectingNative')
      } else {
        bridge.send('stopInspectingNative', false)
      }
    },
    [bridge]
  )

  useEffect(() => {
    if (!bridge) return
    const onStopInspectingNative = () => setIsInspecting(false)
    bridge.addListener('stopInspectingNative', onStopInspectingNative)
    return () => bridge.removeListener('stopInspectingNative', onStopInspectingNative)
  }, [bridge])

  return (
    <ToggleButton value={isInspecting} onChange={(event, value) => handleChange(!isInspecting)}>
      <Search />
    </ToggleButton>
  )
}
