import {
  Box,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import { useIframeStore } from '../store'
import { ExistingAttribute, PanelAttribute, PanelMatch, PanelsResponse } from '../../Shared/PanelTypes'
import React, { ElementType, useMemo, useState } from 'react'
import { partition } from 'lodash-es'

const EnumEditor: BaseEditor<{ values: string[] }> = ({
  values,
  value: defaultValue,
  onChange,
  ...props
}) => {
  const [value, setValue] = useState(defaultValue)
  return values.length > 5 ? (
    <>placeholder</>
  ) : (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(e, newValue) => {
        setValue(newValue)
        onChange(newValue)
      }}
      {...props}
    >
      {values.map((v) => (
        <ToggleButton key={v} value={v}>
          {v}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}

const StringEditor: BaseEditor = ({ value, onChange, ...props }) => {
  return <TextField onChange={(e) => onChange(e.target.value || '')} defaultValue={value} {...props} />
}

const BooleanEditor: BaseEditor = ({ value, onChange, ...props }) => {
  return <Checkbox onChange={(e, v) => onChange(v)} defaultValue={value} {...props} />
}

export type OnChangeValue = string | boolean | undefined
type BaseEditor<T = {}> = ElementType<T & { value?: string; onChange: (value: OnChangeValue) => void }>

const PropEditor = ({
  panelMatch,
  ...props
}: {
  panelMatch: PanelMatch
  value?: string
  onChange: (value: OnChangeValue) => void
  disabled?: boolean
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
  const throttled = useMemo(() => adapter?.setAttribute.bind(adapter), [adapter])
  if (!panels) return null

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

type OnAttributeChange = (attr: PanelAttribute, v: OnChangeValue) => void
export const PropsEditor = React.memo(
  ({
    panels: { attributes, existingAttributes, fileName, location },
    onAttributeChange,
  }: {
    panels: PanelsResponse
    onAttributeChange: OnAttributeChange
  }) => {
    const [there, notThere] = partition(attributes, (attr) =>
      existingAttributes.some((v) => attr.name === v.name)
    )

    const panelAttrs = attributes.length < 10 ? attributes : there
    // const sortedPanels = partition(panels?.attributes, (v) => v.location)
    return (
      <List sx={{ background: 'white' }} dense>
        {panelAttrs.map((attr) => {
          const existing = existingAttributes.find((v) => v.name === attr.name)
          const key = [fileName, location, attr.name].join(':')
          return (
            <Row
              key={key}
              attr={attr}
              existing={existing}
              onChange={(newValue) => onAttributeChange(attr, newValue)}
            />
          )
        })}
      </List>
    )
  }
)

const Row = ({
  attr,
  onChange,
  existing,
}: {
  attr: PanelAttribute
  existing?: ExistingAttribute
  onChange: (value: OnChangeValue) => void
}) => {
  const panel = attr.panels?.[0]

  const [prevValue, setPrevValue] = useState<OnChangeValue>()

  if (!panel) return null
  return (
    <ListItem>
      <ListItemIcon>
        <Checkbox
          checked={!!existing}
          onChange={() => {
            if (existing) {
              setPrevValue(existing.value)
              onChange(undefined)
            } else {
              onChange(prevValue)
              setPrevValue(undefined)
            }
          }}
        />
      </ListItemIcon>
      <Stack>
        <Box>{attr.name}</Box>
        <Box>
          <PropEditor
            panelMatch={panel}
            value={existing?.value || prevValue}
            onChange={onChange}
            disabled={!existing}
          />
        </Box>
      </Stack>
    </ListItem>
  )
}
