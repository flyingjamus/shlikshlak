import React, { ReactNode } from 'react'
import { Button, Accordion , ButtonProps} from '@mui/material'
const A = ({ v }: ButtonProps) => <div>{v}</div>

function B({ count }: { count: number }) {
  return <A v={count}></A>
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
