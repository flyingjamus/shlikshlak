import './App.css'
import React from 'react'
import Screen from './Components/Screen/Screen'
import { GlobalHotKeys, HotKeys } from 'react-hotkeys'
import { redoChange, undoChange } from './tsworker/workerAdapter'
import { styled } from '@mui/material'
import { configure } from 'react-hotkeys'
configure({ ignoreTags: [] })

window.__DEV__ = false

const keyMap = {
  UNDO: 'ctrl+z',
  REDO: 'ctrl+shift+z',
}

const A = styled('div')({
  width: '100%',
  height: '100%',
})

function App() {
  return (
    <GlobalHotKeys
      keyMap={keyMap}
      handlers={{
        UNDO: (e) => {
          e?.preventDefault()
          e?.stopPropagation()
          undoChange()
        },
        REDO: (e) => {
          e?.preventDefault()
          redoChange()
        },
      }}
    >
      <Screen />
    </GlobalHotKeys>
  )
}

export default App
