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
import React, { createContext, ElementType, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { partition } from 'lodash-es'
import { apiClient } from '../../client/apiClient'
import { useBridge } from './UseBridge'
import { useStore } from './UseStore'
import { existingAttributeSchema, panelsResponseSchema } from '../../Shared/PanelTypesZod'
import { AppAutocomplete } from '../Common/AppAutocomplete'
import { getSourceValue, JsonPropsEditor } from './JsonPropsEditor/JsonPropEditor'
import { Launch } from '@mui/icons-material'
import { DefaultPanelValues } from './DefaultPanelValues'
import { useGetPanelsQuery } from '../Common/UseQueries'
import { useYjs, watchYjsString, YjsOriginType } from '../UseYjs'
import { parse, parseExpression } from '@babel/parser'
import traverse from '@babel/traverse'
import * as t from '@babel/types'
import { JSXAttribute } from '@babel/types'
import generate from '@babel/generator'
import * as Y from 'yjs'
import { isDefined } from 'ts-is-defined'
import { SingleLineMonacoEditor } from '../Editor/SingleLineMonacoEditor'
import prettier from 'prettier/standalone'
import prettierPluginBabel from 'prettier/parser-babel'

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
  onChange: (value: OnChangeValue) => void
  disabled?: boolean
  node: t.JSXAttribute
  value: string
}) => {
  if (!panelMatch) {
    return <SingleLineMonacoEditor {...props} />
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

  const { subdoc, text } = useYjs(panels?.fileName)

  const watchYjsString1 = watchYjsString(text)
  const jsxNode: t.JSXElement | undefined = findJSXElementByPosition(
    watchYjsString1 || '',
    panels?.range.startLineNumber,
    panels?.range?.startColumn
  )

  if (!openFile) return null
  if (isLoading)
    return (
      <Box>
        <LinearProgress />
      </Box>
    )
  if (!panels || !subdoc) return null

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
        text={text}
        element={jsxNode}
        panels={panels}
        onAttributeChange={async (attr, newValue) => {
          if (panels?.location && panels.fileName) {
            if (!jsxNode) return
            if (attr.name === 'children') {
              const parsed = newValue !== undefined && parseExpression(newValue, PARSE_OPTIONS)
              jsxNode.children = Array.isArray(parsed) ? parsed : [parsed]

              subdoc?.transact(() => {
                text.delete(jsxNode.start, jsxNode.end - jsxNode.start)
                text.insert(jsxNode.start, generate(jsxNode).code)
              }, YjsOriginType.PROPS_EDITOR)
            } else {
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
              if (!jsxAttr.value) return
              subdoc?.transact(() => {
                text.delete(jsxAttr.start, jsxAttr.end - jsxAttr.start)
                text.insert(jsxAttr.start, `${attr.name}=${newValue}`)
              }, YjsOriginType.PROPS_EDITOR)
            }
          }
        }}
        onBlur={() => refetch()}
      />
    </Box>
  )
}

const PropsEditorContext = createContext<{ doc: Y.Doc; text: Y.Text }>(null as any)
const usePropsEditorContext = () => useContext(PropsEditorContext)

const PARSE_OPTIONS = {
  sourceType: 'module',
  plugins: ['typescript', 'jsx'],
} as const

export function findJSXElementByPosition(
  code: string,
  lineNumber?: number,
  columnNumber?: number
): t.JSXElement | undefined {
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
export const PropsEditor = ({
  panels: { attributes, existingAttributes, fileName, location, range },
  onAttributeChange,
  onBlur,
  element: inputElement,
  text,
}: {
  panels: panelsResponseSchema
  onAttributeChange: OnAttributeChange
  onBlur: () => void
  element: t.JSXElement
  text: Y.Text
}) => {
  const elementRef = useRef(inputElement)
  // Element doesnt update in callback for some reason
  elementRef.current = inputElement
  const element = elementRef.current
  const doc = text.doc
  useEffect(() => {
    setSeenPanels([])
  }, [fileName])
  const existingParsed: JSXAttribute[] =
    element?.openingElement.attributes
      .map((v) => {
        if (v.type === 'JSXAttribute') {
          return v
        }
      })
      .filter(isDefined) || []
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
  const contextValue = useMemo(() => ({ doc, text }), [doc, text])

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
  console.log(element)

  return (
    <PropsEditorContext.Provider value={contextValue}>
      <Box height={'100%'} overflow={'auto'}>
        <List sx={{}} dense onBlur={onBlur}>
          {[
            ...existingParsed,
            element?.children.length
              ? { start: element.openingElement.end! , end: element.closingElement!.start!  }
              : undefined,
          ]
            .filter(isDefined)
            .map((parsed) => {
              console.log(parsed)
              const isChildren = 'name' in parsed
              const name = isChildren ? parsed.name.name : 'children'
              const attr = attributes.find((v) => v.name === name)
              // if ((element?.children?.length || 0) > 1) {
              //   console.error('Multiple children', element)
              // }
              const existing = existingAttributes.find((v) => v.name === name)

              const key = [fileName, location, name.toString()].join(':')
              return (
                <Row
                  key={key}
                  attr={attr}
                  existing={existing}
                  onChange={(newValue) => {
                    const element = elementRef.current
                    doc?.transact(() => {
                      if (name === 'children') {
                        const start = element.openingElement.end!
                        const end = element.closingElement!.start!
                        const oldText = text.toString()
                        const beforeText = oldText.slice(0, start)
                        const afterText = oldText.slice(end, oldText.length)
                        const newText = beforeText + newValue + afterText
                        const formatted = prettier.format(newText, {
                          parser: 'babel',
                          plugins: [prettierPluginBabel],
                        })
                        if (formatted) {
                          text.delete(0, oldText.length)
                          text.insert(0, formatted)
                        } else {
                          console.error('Not formatted')
                        }
                      } else if (parsed) {
                        const start = parsed.start!
                        const end = parsed.end!
                        text.delete(start, end - start)
                        text.insert(start, `${name}=${newValue}`)
                      } else {
                        console.error('Missing parsed')
                        return
                      }
                    }, YjsOriginType.PROPS_EDITOR)
                    // onAttributeChange(attr, newValue)
                  }}
                  node={parsed}
                  name={name}
                  value={getSourceValue(text.toString(), 'value' in parsed ? parsed.value : parsed).trim()}
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
    </PropsEditorContext.Provider>
  )
}

const Row = ({
  attr,
  onChange,
  existing,
  node,
  name,
  value: inputValue,
}: {
  attr?: PanelAttribute
  existing?: existingAttributeSchema
  onChange: (value: OnChangeValue) => void
  node: t.JSXAttribute
  value: string
  name: string
}) => {
  const { doc, text } = usePropsEditorContext()
  const panel = existing
    ? existing.panels?.map((v) => attr?.panels.find((panel) => panel.name === v)).filter(Boolean)?.[0]
    : attr?.panels?.[0]
  const nodeValue = node.value
  const [prevValue, setPrevValue] = useState<OnChangeValue>()
  // : nodeValue?.type === 'StringLiteral' ? nodeValue.
  // if (nodeValue?.type === 'StringLiteral') {
  //   console.log(2222, nodeValue.value)
  // } else if (nodeValue?.type === 'JSXExpressionContainer') {
  //   inputValue = getSourceValue(text.toString(), nodeValue.expression)
  // }

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
        <Box>{name}</Box>
        <Box>
          <PropEditor
            // panelMatch={panel}
            value={innerValue}
            disabled={innerValue === undefined}
            onChange={(v) => {
              setInnerValue(v)
              onChange(v)
            }}
            node={node}
            {...listeners}
          />
        </Box>
      </Stack>
    </ListItem>
  )
}

// const CodePropEditor = () => {
//   return (
//     // <SingleLineMonacoEditor
//     //   onChange={(v) => {
//     //     console.log('change', v)
//     //   }}
//     //   value={}
//     // />
//   )
// }
