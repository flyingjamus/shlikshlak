import { Box, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { useFileStore, useIframeStore } from '../store'
import { PanelMatch, PanelsResponse, PanelType } from '../../Shared/PanelTypes'
import { ElementType } from 'react'

const EnumEditor: BaseEditor<{ values: string[] }> = ({ values, value, onChange }) => {
  return (
    <ToggleButtonGroup value={value} exclusive onChange={(e) => onChange(e.target.value)}>
      {values.map((v) => (
        <ToggleButton key={v} value={v}>
          {v}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}

const StringEditor: BaseEditor = ({ value, onChange }) => {
  return <TextField onChange={(e) => onChange(e.target.value)} value={value} />
}

type BaseEditor<T = {}> = ElementType<T & { value?: string; onChange: (value: string) => void }>

const PropEditor = ({ panelMatch, value }: { panelMatch: PanelMatch; value?: string }) => {
  const props = {
    onChange: (value: string) => {
      console.log('Changed!', value)
    },
    value: value,
  }
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
  return (
    <PropsEditor
      panels={panels}
      onAttributeChange={(attr, v) => {
        tsWorker?.getTypeChecker()
      }}
    />
  )
}

export const PropsEditor = ({
  panels,
}: {
  panels?: PanelsResponse
  onAttributeChange: (attr: string, v: string) => void
}) => {
  return (
    <Box>
      {panels?.existingAttributes
        .map((v) => ({ ...v, panels: panels.attributes.find((a) => a.name === v.name)?.panels }))
        .map((v) => {
          const panel = v.panels?.[0]
          if (!panel) return null
          return (
            <Box key={v.name}>
              <Box>{v.name}</Box>
              <PropEditor panelMatch={panel} value={v.value} />
            </Box>
          )
        })}
    </Box>
  )
}
