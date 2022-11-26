import { styled, Button, Stack, Card, CardHeader, CardContent } from '@mui/material'
import { times } from 'lodash-es'

const A = () => {
  return <B />
}

const C = ({ className }: { className?: string }) => {
  return (
    <div>
      <div className={className}>
        Inner
        <Button placeholder="Hello">Hello</Button>
      </div>
      <Stack direction={'row'} flexWrap={'wrap'}>
        {times(2).map((j) => (
          <Stack direction={'column'} key={j} sx={{flex: 1}}>
            {times(20).map((i) => (
              <Card sx={{ marginTop: '12px' }} key={i}>
                <CardHeader title={'Header'} sx={{ marginBottom: '12px' }}></CardHeader>
                <CardContent>Adslkhsdaj kas akdasdbkdasdakba dsakb</CardContent>
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

export const Story = () => (
  <div>
    <A />
    <D key="1" value={':-)'} />
  </div>
)
