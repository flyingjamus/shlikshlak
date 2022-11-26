import { Box, Checkbox, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { useFileStore, useIframeStore } from '../store'
import {
  ExistingAttribute,
  PanelAttribute,
  PanelMatch,
  PanelsResponse,
  PanelType,
} from '../../Shared/PanelTypes'
import { ElementType, useMemo, useState } from 'react'
import { throttle } from 'lodash-es'
import { partition } from 'lodash-es'

const EnumEditor: BaseEditor<{ values: string[] }> = ({ values, value: defaultValue, onChange }) => {
  const [value, setValue] = useState(defaultValue)
  return values.length > 5 ? (
    <>'placeholder'</>
  ) : (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(e) => {
        const newValue = e.target.value
        setValue(newValue)
        onChange(newValue)
      }}
    >
      {values.map((v) => (
        <ToggleButton key={v} value={v}>
          {v}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}

const StringEditor: BaseEditor = ({ value, onChange }) => {
  return <TextField onChange={(e) => onChange(e.target.value || undefined)} defaultValue={value} />
}

const BooleanEditor: BaseEditor = ({ value, onChange }) => {
  return <Checkbox onChange={(e, v) => onChange(value)} defaultValue={value} />
}

export type OnChangeValue = string | boolean
type BaseEditor<T = {}> = ElementType<T & { value?: string; onChange: (value: OnChangeValue) => void }>

const PropEditor = ({
  panelMatch,
  ...props
}: {
  panelMatch: PanelMatch
  value?: string
  onChange: (value: OnChangeValue) => void
}) => {
  switch (panelMatch.name) {
    case 'string':
      return <StringEditor {...props} />
    case 'enum':
      return <EnumEditor {...props} values={panelMatch.parameters.values} />
    case 'boolean':
      return <BooleanEditor {...props} />
  }
  return null
}

export const PropsEditorWrapper = () => {
  const panels = useIframeStore((v) => v.panels)
  const openFile = useIframeStore((v) => v.openFile)
  const adapter = useIframeStore((v) => v.workerAdapter)
  const throttled = useMemo(
    () => adapter && throttle(adapter.setAttribute.bind(adapter), 500, { trailing: true }),
    [adapter]
  )
  return (
    <PropsEditor
      panels={panels}
      onAttributeChange={(attr, v) => {
        if (panels?.location && panels.fileName) {
          throttled?.(panels.fileName, panels.location, attr.name, v)
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
  onAttributeChange: (attr: PanelAttribute, v: OnChangeValue) => void
}) => {
  // const sortedPanels = partition(panels?.attributes, (v) => v.location)
  return !panels ? null : (
    <Box sx={{ background: 'white' }}>
      {panels?.attributes.slice(0, 5).map((attr) => {
        const existing = panels.existingAttributes.find((v) => v.name === attr.name)
        const panel = attr.panels?.[0]
        if (!panel) return null
        const key = [panels.fileName, panels.location, attr.name].join(':')
        return (
          <Box key={key}>
            <Box>{attr.name}</Box>
            <PropEditor
              panelMatch={panel}
              value={existing?.value}
              onChange={(newValue) => onAttributeChange(attr, newValue)}
            />
          </Box>
        )
      })}
    </Box>
  )
}
