import { BaseEditor } from '../PropsEditor'
import { Box, BoxProps } from '@mui/material'
import { useMergeRefs } from 'rooks'
import { parseExpression } from '@babel/parser'
import {
  isObjectExpression,
  isObjectProperty,
  Node,
  ObjectExpression,
  objectProperty,
  ObjectProperty,
  stringLiteral,
} from '@babel/types'
import generate from '@babel/generator'
import {
  ChangeEventHandler,
  createContext,
  ForwardedRef,
  forwardRef,
  InputHTMLAttributes,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createStore, useStore } from 'zustand'
import { get as objectGet, set as objectSet } from 'lodash-es'
import { isDefined } from 'ts-is-defined'
import assert from 'assert'

const getSourceValue = (source: string, node: Node) => {
  if (!node.start || !node.end) return ''
  return source.slice(node.start, node.end)
}

const autoSizeInput = (el?: HTMLInputElement | null) => {
  if (el) {
    el.style.width = `${el.value.length}ch`
    el.style.boxSizing = 'content-box'
  }
}

type EditableTextProps = {
  value: string | number
  onChange: (v: string | number) => void
  className?: string
  inputProps?: InputHTMLAttributes<HTMLInputElement>
}

const AutoSizingInput = forwardRef(
  (
    { onChange: onChangeProp, ...props }: InputHTMLAttributes<HTMLInputElement>,
    inputRef: ForwardedRef<HTMLInputElement>
  ) => {
    const ref = useRef<HTMLInputElement>(null)
    useEffect(() => {
      autoSizeInput(ref.current)
    }, [props.value, ref])
    const onChange: ChangeEventHandler<HTMLInputElement> = useCallback(
      (...args) => {
        onChangeProp?.(...args)
        autoSizeInput(ref.current)
      },
      [onChangeProp, ref]
    )
    return <input onChange={onChange} {...props} ref={useMergeRefs(ref, inputRef)} />
  }
)

const EditableText = forwardRef(({ value, onChange, className, inputProps }: EditableTextProps, ref) => {
  const prevValueRef = useRef(value)
  return (
    <Box
      ref={ref}
      sx={({ typography }) => ({ fontSize: '16px', border: '0px solid hotpink', ...typography.mono })}
      component={AutoSizingInput}
      value={value}
      onFocus={(e) => {
        prevValueRef.current = e.target.value
        e.target.select()
      }}
      className={className}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          const el = e.target as HTMLInputElement
          onChange(prevValueRef.current)
          el.blur()
        }
      }}
      {...inputProps}
    />
  )
})

const NodeEditor = forwardRef(
  ({ node, onChange }: { node: Node; onChange: (value: string) => void }, ref) => {
    switch (node.type) {
      case 'StringLiteral': {
        return <EditableText ref={ref} onChange={(v) => onChange(JSON.stringify(v))} value={node.value} />
      }
      case 'NumericLiteral': {
        return <EditableText ref={ref} onChange={(v) => onChange(v.toString())} value={node.value} />
      }
      case 'Identifier': {
        return <EditableText ref={ref} onChange={(v) => onChange(JSON.stringify(v))} value={node.name} />
      }
      default: {
        return (
          <Box sx={({ typography }) => ({ fontSize: '16px', ...typography.mono })}>{generate(node).code}</Box>
        )
      }
    }
  }
)

const Item = ({
  prop,
  path,
  onAddBelow,
  onRemove,
}: {
  prop: ObjectProperty
  path: string[]
  onAddBelow: () => void
  onRemove: () => void
}) => {
  const isExpanded = useJsonEditorStore((v) => objectGet(v.expandedItems, path))
  const { expandItem, updateText } = useJsonEditorStore((v) => v.methods)
  const firstInputRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (
      prop.key.type === 'StringLiteral' &&
      prop.key.value === '' &&
      prop.value.type === 'StringLiteral' &&
      prop.value.value === ''
    ) {
      firstInputRef.current?.focus()
    }
  }, [prop])
  return (
    <>
      <Box
        ref={containerRef}
        sx={{ position: 'relative' }}
        onBlur={() => {
          setTimeout(() => {
            const focusStillInside =
              document.activeElement && containerRef.current?.contains(document.activeElement)
            if (
              !focusStillInside &&
              ((prop.key.type === 'StringLiteral' && prop.key.value === '') ||
                (prop.value.type === 'StringLiteral' && prop.value.value === ''))
            ) {
              onRemove()
            }
          }, 100)
        }}
      >
        <Box
          sx={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
          onClick={() => onAddBelow()}
        />
        {isObjectExpression(prop.value) ? (
          <Box
            component={'button'}
            sx={{
              fontSize: '1em',
              position: 'absolute',
              left: '-0.7em',
              padding: 0,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'gray',
            }}
            onClick={() => {
              expandItem(path)
            }}
          >
            {isExpanded ? '▾' : '▸'}
          </Box>
        ) : null}
        <KeyValue
          k={
            <NodeEditor
              ref={firstInputRef}
              node={prop.key}
              onChange={(v) => {
                assert(prop.key.start)
                assert(prop.key.end)
                updateText(prop.key.start, prop.key.end, v)
              }}
            />
          }
          v={
            isObjectExpression(prop.value) ? null : (
              <NodeEditor
                node={prop.value}
                onChange={(v) => {
                  assert(prop.value.start)
                  assert(prop.value.end)
                  updateText(prop.value.start, prop.value.end, v)
                }}
              />
            )
          }
        />
      </Box>
      {isExpanded && isObjectExpression(prop.value) ? <ObjectItems obj={prop.value} path={path} /> : null}
    </>
  )
}

const KeyValue = forwardRef(
  (
    { k, v, boxProps }: { k: ReactNode; v: ReactNode; boxProps?: BoxProps },
    ref: ForwardedRef<HTMLDivElement>
  ) => {
    return (
      <Box ref={ref} sx={{ position: 'relative', zIndex: 1, display: 'inline-block' }} {...boxProps}>
        {k}: {v}
      </Box>
    )
  }
)

const ObjectItems = ({ obj, path }: { obj: ObjectExpression; path: string[] }) => {
  const source = useJsonEditorStore((v) => v.source)
  const { updateSource } = useJsonEditorStore((v) => v.methods)

  return (
    <Box sx={{}}>
      <Box sx={{ paddingLeft: '16px' }}>
        {obj.properties.map((v, i) =>
          isObjectProperty(v) ? (
            <Item
              key={i}
              prop={v}
              path={[...path, getSourceValue(source, v.key)]}
              onAddBelow={() => {
                obj.properties.splice(i + 1, 0, objectProperty(stringLiteral(''), stringLiteral('')))
                updateSource()
              }}
              onRemove={() => {
                obj.properties.splice(i, 1)
                updateSource()
              }}
            />
          ) : null
        )}
      </Box>
    </Box>
  )
}

type JSONEditorStoreMethods = {
  expandItem: (path: string[]) => void
  changeSource: (newSource: string, changeVersion?: boolean) => void
  updateText: (start: number, end: number, value: string) => void
  updateSource: () => void
}

type JSONEditorStore = {
  version: number
  expandedItems: ExpandedItems
  source: string
  root: ObjectExpression
  methods: JSONEditorStoreMethods
}

type ExpandedItems = { [key: string]: ExpandedItems }

type TreeRep = { [key: string]: TreeRep }

// const recurse = (exp: Node, source: string): ExpandedItems => {
//   if (isObjectExpression(exp)) {
//     return exp.properties.map((v) => {
//       if (isObjectProperty(v)) {
//         return [getSourceValue(source, v.key), recurse(v.value, source)]
//       } else {
//         return v
//       }
//     })
//   } else {
//     return exp
//   }
// }
const asExpandedItems = (exp: ObjectExpression, source: string): ExpandedItems => {
  const fromEntries = Object.fromEntries(
    exp.properties
      .map((v) =>
        isObjectProperty(v) && isObjectExpression(v.value)
          ? [getSourceValue(source, v.key), asExpandedItems(v.value, source)]
          : undefined
      )
      ?.filter(isDefined)
  )
  if (Object.keys(fromEntries)) {
    return fromEntries
  }
  return {}
}

type JsonStoreProps = { source: string }
const createJsonEditorStore = ({ source: inputSource }: JsonStoreProps) => {
  const getRoot = (source: string) => {
    const parsed = parseExpression(source, {
      plugins: [['typescript', {}]],
    })
    if (!isObjectExpression(parsed)) {
      throw new Error('Something went wrong with parsing')
    }

    return parsed
  }

  const obj = getRoot(inputSource)

  return createStore<JSONEditorStore>()((set, get) => {
    const methods: JSONEditorStoreMethods = {
      expandItem: (path) => {
        const expandedItems = get().expandedItems
        set({ expandedItems: objectSet({ ...expandedItems }, path, !objectGet(expandedItems, path)) })
      },
      changeSource: (newSource, changeVersion = false) => {
        set({
          root: getRoot(newSource),
          source: newSource,
          version: get().version + (changeVersion ? 1 : 0),
        })
      },
      updateText: (start, end, value) => {
        methods.changeSource(get().source.slice(0, start) + value + get().source.slice(end))
      },
      updateSource: () => {
        methods.changeSource(generate(get().root).code)
      },
    }
    return {
      version: 0,
      expandedItems: asExpandedItems(obj, inputSource),
      root: obj,
      source: inputSource,
      methods: methods,
    }
  })
}

type JsonEditorStore = ReturnType<typeof createJsonEditorStore>

const JsonEditorContext = createContext<JsonEditorStore>(null as any)

const JsonEditorContextProvider = ({ children, ...props }: { children: ReactNode } & JsonStoreProps) => {
  const storeRef = useRef<JsonEditorStore>()
  if (!storeRef.current) {
    storeRef.current = createJsonEditorStore(props)
  }
  return <JsonEditorContext.Provider value={storeRef.current}>{children}</JsonEditorContext.Provider>
}

function useJsonEditorStore<T>(
  selector: (state: JSONEditorStore) => T,
  equalityFn?: (left: T, right: T) => boolean
): T {
  const store = useContext(JsonEditorContext)
  if (!store) throw new Error('Missing JsonStore Provider in the tree')
  return useStore(store, selector, equalityFn)
}

const Root = () => {
  const obj = useJsonEditorStore((v) => v.root)

  return <ObjectItems obj={obj} path={[]} />
}

export const JsonPropsEditor: BaseEditor<string> = ({ value: inputValue, ...props }) => {
  const expandedValue = useMemo(() => inputValue || '{}', [inputValue])

  return (
    <JsonEditorContextProvider source={expandedValue}>
      <Box sx={{ display: 'inline-block' }}>
        <Root />
      </Box>
    </JsonEditorContextProvider>
  )
}
