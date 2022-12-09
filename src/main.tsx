import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
const queryClient = new QueryClient()

const App = React.lazy(() => import('./App'))
const StoriesIndex = React.lazy(() => import('./stories/StoriesIndex'))
const SingleStory = React.lazy(() => import('./stories/SingleStory'))

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/stories',
    element: <StoriesIndex />,
  },
  {
    path: '/stories/:id',
    element: <SingleStory />,
  },
])
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  // <React.StrictMode>

  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>

  // </React.StrictMode>
)
