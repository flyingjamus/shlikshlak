import './App.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import Screen from './Components/Screen/Screen'

window.__DEV__ = false

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Screen />
    </QueryClientProvider>
  )
}

export default App
