import React, { ReactNode } from 'react'
import { Button, Accordion } from '@mui/material'

const Comp = ({ children }: { children: ReactNode }) => {
  return (
    <Accordion>
      <Button
        onClick={() => {
          throw new Error('adads!')
        }}
      >
        {children}
      </Button>
    </Accordion>
  )
}

export default function () {
  return (
    <div>
      <Comp>Hello!!!1</Comp>
    </div>
  )
}
