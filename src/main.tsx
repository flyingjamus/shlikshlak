import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CircularProgress } from '@mui/material'
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
    <Suspense fallback={<CircularProgress />}>
      <RouterProvider router={router} />
    </Suspense>
  </QueryClientProvider>

  // </React.StrictMode>
)
