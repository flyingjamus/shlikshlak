import { JsonPropsEditor } from './JsonPropEditor'

const VAL = `
      {
        display: 'flex',
        // something: 'else',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderRadius: '8px',
        alignItems: 'center',
        '.MuiIconButton-root': {
          opacity: 0
        },
        '&:hover': {
          background: (theme) => theme.palette.primary[30],
          '.MuiIconButton-root': {
            opacity: 1
          }
        }
      }
`

export const Main = () => {
  return (
    <JsonPropsEditor
      value={VAL}
      onChange={(v) => {
        console.log(v)
      }}
    />
  )
}

export const ArrowFunction = () => {
  return (
    <JsonPropsEditor
      value={`() => (${VAL})`}
      onChange={(v) => {
        console.log(v)
      }}
    />
  )
}
