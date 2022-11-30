import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

const App = React.lazy(() => import('./App'))
const StoriesIndex = React.lazy(() => import('./stories/StoriesIndex'))
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/stories/:path',
    element: <StoriesIndex />,
  },
])
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  // <React.StrictMode>

  <RouterProvider router={router} />

  // </React.StrictMode>
)
