  import { styled, Button, Stack, Card, CardHeader, CardContent, SxProps } from '@mui/material'
import { times } from 'lodash-es'
import { ReactNode } from 'react'

const A = () => {
  return (
    <B primary header={'Headertext'}>
      This is the content!@!#!321
    </B>
  )
}

const S: SxProps ={
  marginBottom: 5
}

const C = ({
  className,
  children,
  header,
  primary,
}: {
  className?: string
  children: ReactNode
  header: ReactNode
  primary: boolean
}) => {
  return (
    <div suppressContentEditableWarning>
      <div className={className}>
        Inner
        <Button placeholder="Hello">Hello</Button>
      </div>
      <Stack direction={'row'} flexWrap={'wrap'}>
        {times(2).map((j) => (
          <Stack direction={'column'} key={j}>
            {times(2).map((i) => (
              <Card sx={S} key={i}>
                <CardHeader sx={{ marginBottom: '12px' }} title={header} action={"asdsadsa"} ></CardHeader>
                <CardContent>{children}</CardContent>
              </Card>
            ))}
          </Stack>
        ))}
      </Stack>
    </div>
  )
}

const B = styled(C)({
  background: 'hotpink',
  padding: '20px',
})

const D = ({ value }: { value: string }) => {
  return <div>HEllo {value}</div>
}

export const StoryRoot = () => (
  <div>
    <A />
    <D key="1" value={':-)'} />
  </div>
)
