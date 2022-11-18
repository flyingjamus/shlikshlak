import React, { ReactNode } from 'react'
import { Button, Accordion, ButtonProps, Stack, Box } from '@mui/material'
import { Screen } from '../src/Components/Screen/Screen'

function A({ count }: { count: number }) {
  return <Screen />
}

function B({ count }: { count: number }) {
  return (
    <Box>
      <Button variant={'contained'} />
    </Box>
  )
}

// const Comp = ({ children }: { children: ReactNode }) => {
//   return (
//     <Accordion>
//       <Button
//         onClick={() => {
//           throw new Error('adads!')
//         }}
//       >
//         {children}
//       </Button>
//     </Accordion>
//   )
// }
//
// export default function () {
//   return (
//     <div>
//       <Comp>Hello!!!1</Comp>
//     </div>
//   )
// }
