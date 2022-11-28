import './App.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import React from 'react'

window.__DEV__ = false

const Screen = React.lazy(() => import('./Components/Screen/Screen'))
const StoriesIndex = React.lazy(() => import('./stories/StoriesIndex'))
const router = createBrowserRouter([
  {
    path: '/',
    element: <Screen />,
  },
  {
    path: '/stories/:path',
    element: <StoriesIndex />,
  },
])

const queryClient = new QueryClient()
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

export default App
