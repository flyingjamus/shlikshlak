import './App.css'
import React from 'react'
import Screen from './Components/Screen/Screen'
import { configure } from 'react-hotkeys'
import { Hotkeys } from './Components/Hotkeys'

configure({ ignoreTags: [] })

window.__DEV__ = false

function App() {
  return (
    <Hotkeys>
      <Screen />
    </Hotkeys>
  )
}

export default App
