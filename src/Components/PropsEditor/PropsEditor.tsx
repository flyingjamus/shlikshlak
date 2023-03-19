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
import { useBridge } from './UseBridge'
import { useStore } from './UseStore'
import { inspectElement } from './InspectElement'
import { Source } from '../ReactDevtools/react-devtools-shared/shared/ReactElementType'
import { existingAttributeSchema } from '../../Shared/PanelTypesZod'
import { AppAutocomplete } from '../Common/AppAutocomplete'
import { JsonPropsEditor } from './JsonPropsEditor/JsonPropEditor'

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
  value: inputValue,
  onChange,
  ...props
}) => {
  const isExpression = !inputValue || inputValue.startsWith('{')
  const stringInput = (isExpression ? inputValue?.slice(2, -2) : inputValue?.slice(1, -1)) || ''
  const [value, setValue] = useState(stringInput)
  return values.length > 5 ? (
    <AppAutocomplete
      disablePortal
      options={values}
      value={value}
      onChange={(e, v) => {
        if (v) {
          onChange(isExpression ? `{'${v}'}` : `'${v}'`)
        }
      }}
    />
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

const BaseStringEditor: BaseEditor<string> = ({ value: inputValue, onChange, ...props }) => {
  const [focused, setFocused] = useState(false)
  const [value, setValue] = useState(inputValue)
  useEffect(() => {
    if (!focused) {
      setValue(inputValue)
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
        onChange(v)
      }}
      value={value}
      {...props}
    />
  )
}

const CodeEditor: BaseEditor<string> = ({ value: inputValue, onChange, ...props }) => {
  const isExpression = inputValue?.startsWith('{')
  const stringInput = (isExpression ? inputValue?.slice(1, -1) : inputValue) || ''
  return (
    <JsonPropsEditor
      onChange={(v) => {
        onChange(isExpression ? `{${v}}` : v)
      }}
      value={stringInput}
    />
  )
}

const StringEditor: BaseEditor<string> = ({ value: inputValue, onChange, ...props }) => {
  const isExpression = !inputValue || inputValue.startsWith('{')
  const stringInput = (isExpression ? inputValue?.slice(2, -2) : inputValue?.slice(1, -1)) || ''
  return (
    <BaseStringEditor
      onChange={(v) => {
        onChange(isExpression ? `{'${v}'}` : `'${v}'`)
      }}
      value={stringInput}
      {...props}
    />
  )
}

const BooleanEditor: BaseEditor<string> = ({ value, onChange, ...props }) => {
  return <Checkbox onChange={(e, v) => onChange(v)} defaultValue={value} {...props} />
}

const ChildrenEditor: BaseEditor<string> = ({ ...props }) => {
  return <BaseStringEditor {...props} />
}

export type OnChangeValue = string | true | undefined
export type BaseEditor<V, T = {}> = ElementType<T & { value?: V; onChange: (value: OnChangeValue) => void }>

const PropEditor = ({
  panelMatch,
  ...props
}: {
  panelMatch?: PanelMatch
  value?: string
  onChange: (value: OnChangeValue) => void
  disabled?: boolean
}) => {
  if (!panelMatch) {
    return <CodeEditor {...props} />
  }
  switch (panelMatch.name) {
    case 'string':
      return <StringEditor {...props} />
    case 'enum':
      return <EnumEditor {...props} values={panelMatch.parameters.values} />
    case 'boolean':
      return <BooleanEditor {...props} />
    // case 'SxProps':
    //   return <SxEditor {...props} />
    case 'Children':
      return <ChildrenEditor {...props} />
  }
  return null
}

const useFiberSource = (id: number | undefined) => {
  // TODO cache result for different responses
  const bridge = useBridge()
  const store = useStore()
  const [result, setResult] = useState<Source | null>(null)
  useEffect(() => {
    ;(async () => {
      if (!id) {
        setResult(null)
        return
      }
      const result = await inspectElement({ bridge, id, store })
      if (result.type === 'full-data') {
        setResult(result.value.source || null)
      }
    })()
  }, [bridge, store, id])

  return result
}

export const PropsEditorWrapper = () => {
  const bridge = useBridge()
  const store = useStore()
  const openFile = useFiberSource(useIframeStore((v) => v.selectedFiberId))

  useEffect(() => {
    if (!bridge) return
    const handleSelectFiber = async (id: number) => {
      useIframeStore.setState({ selectedFiberId: id })
    }
    bridge.addListener('selectFiber', handleSelectFiber)
    return () => bridge.removeListener('selectFiber', handleSelectFiber)
  }, [bridge, store])

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

  useEffect(() => {
    setSeenPanels([])
  }, [openFile])
  useEffect(() => {
    if (panels) {
      setSeenPanels((prev) => {
        const set = new Set(prev)
        for (const attr of panels.existingAttributes) {
          set.add(attr.name)
        }
        return Array.from(set.values())
      })
    }
  }, [panels])
  const [seenPanels, setSeenPanels] = useState<string[]>([])

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
      seenPanels={seenPanels}
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
    seenPanels,
    panels: { attributes, existingAttributes, fileName, location },
    onAttributeChange,
    onBlur,
  }: {
    seenPanels: string[]
    panels: PanelsResponse
    onAttributeChange: OnAttributeChange
    onBlur: () => void
  }) => {
    // console.log(panels, seenPanels)
    const [added, setAdded] = useState([])
    const [there, notThere] = partition(
      attributes,
      (attr) =>
        existingAttributes.some((existing) => attr.name === existing.name) ||
        seenPanels.includes(attr.name) ||
        added.includes(attr.name)
    )

    const showAll = attributes.length < 10
    const panelAttrs = showAll ? attributes : there

    return (
      <Box height={'100%'} overflow={'auto'}>
        <List sx={{ background: 'white' }} dense onBlur={onBlur}>
          {panelAttrs.map((attr) => {
            const existing = existingAttributes.find((v) => v.name === attr.name)
            const key = [fileName, location, attr.name].join(':')
            return (
              <Row
                key={key}
                attr={attr}
                existing={existing}
                onChange={(newValue) => {
                  onAttributeChange(attr, newValue)
                }}
              />
            )
          })}
          {showAll ? null : (
            <ListItem>
              <AppAutocomplete
                label={'Add'}
                sx={{ width: '100%' }}
                options={notThere.map((v) => v.name)}
                onChange={(e, v) => {
                  setAdded((added) => [...added, v])
                }}
              />
            </ListItem>
          )}
        </List>
      </Box>
    )
  }
)

const Row = ({
  attr,
  onChange,
  existing,
}: {
  attr: PanelAttribute
  existing?: existingAttributeSchema
  onChange: (value: OnChangeValue) => void
}) => {
  const panel = existing ? attr.panels.find((v) => existing.panels?.includes(v.name)) : attr.panels?.[0]

  const [prevValue, setPrevValue] = useState<OnChangeValue>()

  return (
    <ListItem>
      <ListItemIcon>
        <Checkbox
          defaultChecked={!!existing}
          onChange={(e, checked) => {
            if (checked) {
              onChange(prevValue)
              setPrevValue(undefined)
            } else {
              setPrevValue(existing?.value)
              onChange(undefined)
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
            disabled={!!prevValue}
          />
        </Box>
      </Stack>
    </ListItem>
  )
}
