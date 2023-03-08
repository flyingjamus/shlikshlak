import React, { ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { GlobalHotKeys } from 'react-hotkeys'
import { redoChange, undoChange } from '../tsworker/workerAdapter'

const keyMap = {
  UNDO: 'ctrl+z',
  REDO: 'ctrl+shift+z',
}
export const Hotkeys = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient()
  return (
    <GlobalHotKeys
      keyMap={keyMap}
      handlers={{
        UNDO: async (e) => {
          e?.preventDefault()
          await undoChange()
          await queryClient.invalidateQueries(['getPanelsAtPosition'])
        },
        REDO: async (e) => {
          e?.preventDefault()
          await redoChange()
          await queryClient.invalidateQueries(['getPanelsAtPosition'])
        },
      }}
    >
      {children}
    </GlobalHotKeys>
  )
}
