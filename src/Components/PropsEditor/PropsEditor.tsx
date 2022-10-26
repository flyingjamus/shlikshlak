import { Box, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { useFileStore, useIframeStore } from '../store'
import { PanelMatch, PanelsResponse, PanelType } from '../../Shared/PanelTypes'
import { ElementType, useMemo, useState } from 'react'
import { throttle } from 'lodash-es'

const EnumEditor: BaseEditor<{ values: string[] }> = ({ values, value: defaultValue, onChange }) => {
  const [value, setValue] = useState(defaultValue)
  return (
    <ToggleButtonGroup value={value} exclusive onChange={(e) => {
      const newValue = e.target.value
      setValue(newValue)
      onChange(newValue)
    }}>
      {values.map((v) => (
        <ToggleButton key={v} value={v}>
          {v}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}

const StringEditor: BaseEditor = ({ value, onChange }) => {
  return <TextField onChange={(e) => onChange(e.target.value)} defaultValue={value} />
}

type BaseEditor<T = {}> = ElementType<T & { value?: string; onChange: (value: string) => void }>

const PropEditor = ({
  panelMatch,
  ...props
}: {
  panelMatch: PanelMatch
  value?: string
  onChange: (value: string) => void
}) => {
  switch (panelMatch.name) {
    case 'string':
      return <StringEditor {...props} />
    case 'enum':
      return <EnumEditor {...props} values={panelMatch.parameters.values} />
    case 'boolean':
      break
  }
  return null
}

export const PropsEditorWrapper = () => {
  const panels = useIframeStore((v) => v.panels)
  const adapter = useIframeStore((v) => v.workerAdapter)
  const throttled = useMemo(
    () => adapter && throttle(adapter.setAttribute.bind(adapter), 200, { trailing: true }),
    [adapter]
  )
  return (
    <PropsEditor
      panels={panels}
      onAttributeChange={(attr, v) => {
        if (panels?.location && panels.fileName) {
          throttled?.(panels.fileName, panels.location, attr, v)
        }
      }}
    />
  )
}

export const PropsEditor = ({
  panels,
  onAttributeChange,
}: {
  panels?: PanelsResponse
  onAttributeChange: (attr: string, v: string) => void
}) => {
  return (
    <Box>
      {panels?.existingAttributes
        .map((v) => ({ ...v, panels: panels.attributes.find((a) => a.name === v.name)?.panels }))
        .map((attr) => {
          const panel = attr.panels?.[0]
          if (!panel) return null
          return (
            <Box key={attr.name}>
              <Box>{attr.name}</Box>
              <PropEditor
                panelMatch={panel}
                value={attr.value}
                onChange={(newValue) => onAttributeChange(attr.name, newValue)}
              />
            </Box>
          )
        })}
    </Box>
  )
}
