import './App.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import React from 'react'

window.__DEV__ = false

const Screen = React.lazy(() => import('./Components/Screen/Screen'))
const StoriesIndex = React.lazy(() => import('./Components/Stories/StoriesIndex'))
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
function App() {
  return <RouterProvider router={router} />
}

export default App
