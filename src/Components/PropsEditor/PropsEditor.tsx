import {
  Box,
  Checkbox,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useIframeMethods, useIframeStore } from '../store'
import { ExistingAttributeValueObject, PanelAttribute, PanelMatch } from '../../Shared/PanelTypes'
import React, { ElementType, useEffect, useMemo, useState } from 'react'
import { partition } from 'lodash-es'
import { apiClient } from '../../client/apiClient'
import { setAttribute } from '../../tsworker/workerAdapter'
import { useBridge } from './UseBridge'
import { useStore } from './UseStore'
import { existingAttributeSchema, panelsResponseSchema } from '../../Shared/PanelTypesZod'
import { AppAutocomplete } from '../Common/AppAutocomplete'
import { JsonPropsEditor } from './JsonPropsEditor/JsonPropEditor'
import { Launch } from '@mui/icons-material'
import { DefaultPanelValues } from './DefaultPanelValues'
import { useGetPanelsQuery } from '../Common/UseQueries'
import { useYjs, useYjsText } from '../UseYjs'
import { parse, parseExpression } from '@babel/parser'
import traverse from '@babel/traverse'
import * as t from '@babel/types'
import generate from '@babel/generator'

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
  const isExpression = inputValue?.startsWith && inputValue?.startsWith('{')
  if (inputValue && !inputValue.startsWith) {
    // console.error('WRONG TYPE FOR INPUTVALUE', inputValue)
  }
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

const BooleanEditor: BaseEditor<boolean | undefined> = ({ value, onChange, ...props }) => {
  return (
    <Checkbox
      onChange={(e, v) => {
        console.log(v)
        onChange(v)
      }}
      checked={value !== false}
      {...props}
    />
  )
}

const ChildrenEditor: BaseEditor<string> = ({ ...props }) => {
  return <BaseStringEditor {...props} />
}

export type OnChangeValue = string | true | false | undefined
export type BaseEditor<V, T = {}> = ElementType<T & { value?: V; onChange: (value: OnChangeValue) => void }>

const useFocusValue = () => {
  const [focused, setFocused] = useState(false)
  const listeners = useMemo(
    () => ({
      onFocus: () => {
        setFocused(true)
      },
      onBlur: () => {
        setFocused(false)
      },
    }),
    []
  )
  return {
    listeners: listeners,
    focused,
  }
}

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
  return <>Unsupported</>
}

export const PropsEditorWrapper = () => {
  const bridge = useBridge()
  const store = useStore()
  const openFile = useIframeStore((v) => v.selectedFiberSource)
  const { selectFiber } = useIframeMethods()

  useEffect(() => {
    if (!bridge) return
    const handleSelectFiber = async (id: number) => {
      selectFiber(id)
    }
    bridge.addListener('selectFiber', handleSelectFiber)
    return () => bridge.removeListener('selectFiber', handleSelectFiber)
  }, [bridge, selectFiber, store])

  const { data: panels, refetch, isLoading } = useGetPanelsQuery(openFile)

  const { subdoc } = useYjs(panels?.fileName)
  const jsxNode = findJSXElementByPosition(
    useYjsText(panels?.fileName) || '',
    panels?.range.startLineNumber,
    panels?.range?.startColumn
  )
  console.log(3213132, jsxNode)

  if (!openFile) return null
  if (isLoading)
    return (
      <Box>
        <LinearProgress />
      </Box>
    )
  if (!panels) return null

  return (
    <Box>
      <Stack sx={{ flexDirection: 'row', justifyContent: 'flex-end', padding: '0 12px' }}>
        <IconButton
          onClick={() => {
            const { columnNumber, lineNumber, fileName } = openFile
            apiClient.post('/launch_editor', {
              fileName,
              lineNumber,
              colNumber: columnNumber,
            })
          }}
        >
          <Launch />
        </IconButton>
      </Stack>
      <PropsEditor
        panels={panels}
        onAttributeChange={async (attr, newValue) => {
          if (panels?.location && panels.fileName) {
            if (!jsxNode) return
            const text = subdoc.getText()
            if (attr.name === 'children') {
              console.log(31123311, jsxNode, jsxNode?.children)
              const parsed = newValue !== undefined && parseExpression(newValue, PARSE_OPTIONS)
              console.log(jsxNode, parsed)
              jsxNode.children = Array.isArray(parsed) ? parsed : [parsed]

              subdoc?.transact(() => {
                text.delete(jsxNode.start, jsxNode.end - jsxNode.start)
                text.insert(jsxNode.start, generate(jsxNode).code)
              })
              console.log(1323132, generate(jsxNode))
            } else {
              console.log(jsxNode, jsxNode?.openingElement)
              const jsxAttr: t.JSXAttribute = jsxNode?.openingElement.attributes
                .filter((v) => t.isJSXAttribute(v))
                .map((v) => v as t.JSXAttribute)
                .find((v) => v.name.name === attr.name)
              if (!jsxAttr) {
                console.error('JSX attr not found')
                return
              }

              jsxAttr.value = t.jsxExpressionContainer(t.valueToNode(newValue))
              // const { code } = generate(jsxAttr, {concise: true})
              console.log(jsxAttr)
              if (!jsxAttr.value) return
              subdoc?.transact(() => {
                text.delete(jsxAttr.start, jsxAttr.end - jsxAttr.start)
                text.insert(jsxAttr.start, `${attr.name}=${newValue}`)
              })
            }
          }
        }}
        onBlur={() => refetch()}
      />
    </Box>
  )
}
const PARSE_OPTIONS = {
  sourceType: 'module',
  plugins: ['typescript', 'jsx'],
} as const

function findJSXElementByPosition(
  code: string,
  lineNumber?: number,
  columnNumber?: number
): t.JSXElement | undefined {
  console.log('findJSXElementByPosition', lineNumber, columnNumber)
  if (lineNumber === undefined || columnNumber === undefined) return

  try {
    const ast = parse(code, PARSE_OPTIONS)

    let foundNode: t.JSXElement | undefined = undefined

    traverse(ast, {
      JSXOpeningElement(path) {
        if (
          path.node.loc &&
          path.node.loc.start.line <= lineNumber &&
          lineNumber <= path.node.loc.end.line &&
          path.node.loc.start.column <= columnNumber
        ) {
          foundNode = path.parent
          path.stop()
        }
      },
    })

    return foundNode
  } catch (e) {
    console.log('Error parsing code', e)
  }
}

type OnAttributeChange = (attr: PanelAttribute, v: OnChangeValue) => void
export const PropsEditor = React.memo(
  ({
    panels: { attributes, existingAttributes, fileName, location },
    onAttributeChange,
    onBlur,
  }: {
    panels: panelsResponseSchema
    onAttributeChange: OnAttributeChange
    onBlur: () => void
  }) => {
    useEffect(() => {
      setSeenPanels([])
    }, [fileName])
    useEffect(() => {
      if (existingAttributes) {
        setSeenPanels((prev) => {
          const set = new Set(prev)
          for (const attr of existingAttributes) {
            set.add(attr.name)
          }
          return Array.from(set.values())
        })
      }
    }, [existingAttributes])
    const [seenPanels, setSeenPanels] = useState<string[]>([])

    const [added, setAdded] = useState<string[]>([])
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
        <List sx={{}} dense onBlur={onBlur}>
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
              <Box sx={{ width: '100%' }}>
                <Box>
                  <Typography variant={'overline'}>Add</Typography>
                </Box>
                <Box sx={{ width: '100%' }}>
                  <AppAutocomplete
                    options={notThere.map((v) => v.name)}
                    onChange={(e, v) => {
                      setAdded((added) => [...added, v])
                    }}
                    fullWidth
                  />
                </Box>
              </Box>
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
  const panel = existing
    ? existing.panels?.map((v) => attr.panels.find((panel) => panel.name === v)).filter(Boolean)?.[0]
    : attr.panels?.[0]

  const [prevValue, setPrevValue] = useState<OnChangeValue>()
  const inputValue = existing?.value
  const [innerValue, setInnerValue] = useState(inputValue)
  const { focused, listeners } = useFocusValue()
  useEffect(() => {
    if (!focused) {
      setInnerValue(inputValue)
    }
  }, [inputValue, focused])

  const value = focused ? innerValue : inputValue
  return (
    <ListItem>
      <ListItemIcon>
        <Checkbox
          defaultChecked={!!existing}
          onChange={(e, checked) => {
            if (checked) {
              if (prevValue === undefined) {
                if (panel) {
                  const defaultPanelValue = DefaultPanelValues[panel.name]
                  onChange(defaultPanelValue)
                  setInnerValue(defaultPanelValue)
                }
              } else {
                setInnerValue(prevValue)
                onChange(prevValue)
              }
              setPrevValue(undefined)
            } else {
              setPrevValue(value)
              setInnerValue(undefined)
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
            value={value}
            disabled={innerValue === undefined}
            onChange={(v) => {
              setInnerValue(v)
              onChange(v)
            }}
            {...listeners}
          />
        </Box>
      </Stack>
    </ListItem>
  )
}
