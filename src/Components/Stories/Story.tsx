import { styled, Button } from '@mui/material'

const A = () => {
  return <B />
}

const C = ({ className }: { className?: string }) => {
  return <div className={className}>
  Inner
  <Button placeholder="Hello" >Hello</Button>
  
  </div>
}

const B = styled(C)({
  background: 'hotpink',
  padding: '20px',
})

export const Story = () => <A />
