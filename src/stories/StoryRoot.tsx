import { styled, Button, Stack, Card, CardHeader, CardContent } from '@mui/material'
import { times } from 'lodash-es'
import { ReactNode } from 'react'

const A = () => {
  return <B header={"Header"}>dasdsdsadsa</B>
}

const C = ({ className, children, header }: { className?: string, children: ReactNode, header: ReactNode }) => {
  return (
    <div suppressContentEditableWarning>
      <div className={className}>
        Inner
        <Button placeholder="Hello">Hello</Button>
      </div>
      <Stack direction={'row'} flexWrap={'wrap'}>
        {times(2).map((j) => (
          <Stack direction={'column'} sx={{ flex: 1 }} key={j}>
            {times(20).map((i) => (
              <Card sx={{ marginTop: '12px' }} key={i}>
                <CardHeader title={header} sx={{ marginBottom: '12px' }}></CardHeader>
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
