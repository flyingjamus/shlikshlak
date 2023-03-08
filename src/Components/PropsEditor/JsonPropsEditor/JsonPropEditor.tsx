import { BaseEditor } from '../PropsEditor'
import { Box, ClickAwayListener } from '@mui/material'
import { isObject } from 'lodash-es'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import t from '@babel/template'
import generate from '@babel/generator'
import useSize from 'react-use/esm/useSize'
import {
  isExpressionStatement,
  isAssignmentExpression,
  isObjectExpression,
  isObjectProperty,
  Expression,
  ObjectExpression,
  ObjectProperty,
  isArrayExpression,
  Node,
} from '@babel/types'
import {
  ChangeEventHandler,
  Fragment,
  InputHTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

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

const AutoSizingInput = ({ onChange: onChangeProp, ...props }: InputHTMLAttributes<HTMLInputElement>) => {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    autoSizeInput(ref.current)
  }, [])
  const onChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (...args) => {
      onChangeProp?.(...args)
      autoSizeInput(ref.current)
    },
    [onChangeProp]
  )
  return <input onChange={onChange} {...props} ref={ref} />
}

const EditableText = ({ children, onChange }: { children: string; onChange: (v: string) => void }) => {
  const prevValueRef = useRef(children)
  return (
    <Box
      sx={({ typography }) => ({ fontSize: '16px', border: '0px solid hotpink', ...typography.mono })}
      component={AutoSizingInput}
      defaultValue={children}
      onFocus={(e) => {
        prevValueRef.current = e.target.value
        e.target.select()
      }}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          const el = e.target as HTMLInputElement
          el.value = prevValueRef.current
          onChange(prevValueRef.current)
          el.blur()
          autoSizeInput(el)
        }
      }}
    />
  )
}

const Item = ({
  prop,
  source,
  onChanged,
}: {
  prop: ObjectProperty
  source: string
  onChanged: () => void
}) => {
  const isValueObject = useMemo(() => {
    return isObjectExpression(prop.value)
  }, [prop.value])
  return (
    <Box>
      <EditableText
        onChange={(v) => {
          if (v !== '') {
            prop.key = t.expression`${v}`() as Expression
            onChanged()
          }
        }}
      >
        {getSourceValue(source, prop.key)}
      </EditableText>
      {getSourceValue(source, prop.value)}
    </Box>
  )
}

export const JsonPropsEditor: BaseEditor<string> = ({ value: inputValue, ...props }) => {
  const expandedValue = useMemo(() => 'a = ' + (inputValue || '{}'), [inputValue])
  const obj = useMemo(() => {
    const parsed = parse(expandedValue, {
      plugins: [['typescript', {}]],
    })
    const bodyElement = parsed.program.body[0]
    if (
      isExpressionStatement(bodyElement) &&
      isAssignmentExpression(bodyElement.expression) &&
      isObjectExpression(bodyElement.expression.right)
    ) {
      return bodyElement.expression.right
    }
    throw new Error('Something went wrong with parsing')
  }, [expandedValue])

  return (
    <Box>
      {obj.properties.map((v, i) =>
        isObjectProperty(v) ? (
          <Item
            key={i}
            prop={v}
            source={expandedValue}
            onChanged={() => {
              console.log(generate(obj).code)
            }}
          />
        ) : null
      )}
    </Box>
  )
}
