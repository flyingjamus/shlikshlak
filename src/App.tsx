import './App.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import Screen from './Components/Screen/Screen'

window.__DEV__ = false

function App() {
  return <Screen />
}

export default App
