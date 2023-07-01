import React, { ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { GlobalHotKeys } from 'react-hotkeys'
import { getActiveModelAndSubdoc } from './UseYjs'

const keyMap = {
  UNDO: 'ctrl+z',
  REDO: 'ctrl+shift+z',
  JUMP: 'ctrl+alt+a',
}
export const Hotkeys = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient()
  return (
    <GlobalHotKeys
      keyMap={keyMap}
      handlers={{
        UNDO: async (e) => {
          e?.preventDefault()
          const modelAndSubdoc = getActiveModelAndSubdoc()
          if (!modelAndSubdoc) return
          const { undoManager } = modelAndSubdoc
          undoManager?.undo()
          await queryClient.invalidateQueries(['getPanelsAtPosition'])
        },
        REDO: async (e) => {
          e?.preventDefault()
          const modelAndSubdoc = getActiveModelAndSubdoc()
          if (!modelAndSubdoc) return
          const { undoManager } = modelAndSubdoc
          undoManager?.redo()
          await queryClient.invalidateQueries(['getPanelsAtPosition'])
        },
        JUMP: (e) => {
          const listener = (e: MouseEvent) => {
            console.log(e.target)
            window.removeEventListener('click', listener)
          }
          window.addEventListener('click', listener)
        },
      }}
    >
      {children}
    </GlobalHotKeys>
  )
}
