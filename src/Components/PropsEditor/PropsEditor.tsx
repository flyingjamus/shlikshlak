import {
  Box,
  Checkbox,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import { useIframeStore } from '../store'
import {
  ExistingAttribute,
  ExistingAttributeValueObject,
  PanelAttribute,
  PanelMatch,
  PanelsResponse,
} from '../../Shared/PanelTypes'
import React, { ElementType, useEffect, useState } from 'react'
import { partition } from 'lodash-es'
import { apiClient } from '../../client/apiClient'
import { setAttribute } from '../../tsworker/workerAdapter'
import { useQuery } from '@tanstack/react-query'
import { useDevtoolsStore } from '../../Devtools/DevtoolsStore'
import path from 'path'
import { useBridge } from './UseBridge'
import { useStore } from './UseStore'
import { inspectElement } from './InspectElement'

const SxEditor: BaseEditor<ExistingAttributeValueObject> = ({ value }) => {
  return (
    <Stack width={'100%'}>
      {value?.map((v, i) => (
        <Stack key={i} direction={'row'} width={'100%'}>
          <Box flex={1}>{v.name}</Box>
          <Box>{v.value}</Box>
        </Stack>
      ))}
    </Stack>
  )
}

const EnumEditor: BaseEditor<string, { values: string[] }> = ({
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

const StringEditor: BaseEditor<string> = ({ value: inputValue, onChange, ...props }) => {
  const [focused, setFocused] = useState(false)
  const [value, setValue] = useState(inputValue)
  useEffect(() => {
    if (!focused) {
      setValue(inputValue || '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue])
  return (
    <TextField
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(e) => {
        const v = e.target.value
        setValue(v)
        onChange(v || '')
      }}
      value={value || ''}
      {...props}
    />
  )
}

const BooleanEditor: BaseEditor<string> = ({ value, onChange, ...props }) => {
  return <Checkbox onChange={(e, v) => onChange(v)} defaultValue={value} {...props} />
}

export type OnChangeValue = string | boolean | undefined
type BaseEditor<V, T = {}> = ElementType<T & { value?: V; onChange: (value: OnChangeValue) => void }>

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
    case 'SxProps':
      return <SxEditor {...props} />
  }
  return null
}

export interface Source {
  fileName: string
  lineNumber: number
  columnNumber: number
}
export const PropsEditorWrapper = () => {
  const bridge = useBridge()
  const store = useStore()
  const [selected, setSelected] = useState<Source | null>(null)
  useEffect(() => {
    if (!bridge) return
    const handleSelectFiber = async (id: number) => {
      const result = await inspectElement({ bridge, id, store })
      if (result.type === 'full-data') {
        setSelected(result.value.source)
      }
      // return dispatchWrapper({ type: 'SELECT_ELEMENT_BY_ID', payload: id })
    }
    bridge.addListener('selectFiber', handleSelectFiber)
    return () => bridge.removeListener('selectFiber', handleSelectFiber)
  }, [bridge, store])
  const openFile = selected

  const {
    data: panels,
    refetch,
    isLoading,
  } = useQuery(['getPanelsAtPosition', openFile], () => {
    if (!openFile?.fileName) return null
    const { columnNumber, lineNumber, fileName } = openFile
    return apiClient.post('/lang/getPanelsAtPosition', {
      fileName: fileName,
      lineNumber: +lineNumber,
      colNumber: +columnNumber,
    })
  })
  if (!openFile) return null
  if (isLoading)
    return (
      <Box>
        <LinearProgress />
      </Box>
    )
  if (!panels) return null

  return (
    <PropsEditor
      panels={panels}
      onAttributeChange={async (attr, v) => {
        if (panels?.location && panels.fileName) {
          await setAttribute(panels.fileName, panels.location, attr.name, v)
        }
      }}
      onBlur={() => refetch()}
    />
  )
}

type OnAttributeChange = (attr: PanelAttribute, v: OnChangeValue) => void
export const PropsEditor = React.memo(
  ({
    panels: { attributes, existingAttributes, fileName, location },
    onAttributeChange,
    onBlur,
  }: {
    panels: PanelsResponse
    onAttributeChange: OnAttributeChange
    onBlur: () => void
  }) => {
    const [there, notThere] = partition(attributes, (attr) =>
      existingAttributes.some((v) => attr.name === v.name)
    )

    const panelAttrs = attributes.length < 10 ? attributes : there
    // const sortedPanels = partition(panels?.attributes, (v) => v.location)
    return (
      <List sx={{ background: 'white' }} dense onBlur={onBlur}>
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
      <Stack width={'100%'}>
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
