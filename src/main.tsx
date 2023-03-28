import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Box, CircularProgress, CssBaseline, LinearProgress, ThemeProvider } from '@mui/material'
import theme from './theme'
const queryClient = new QueryClient()
// @ts-ignore
import hookData from 'shlikshlak/dist/hook.js?raw'

// import Buffer from 'buffer/'
// window.Buffer = Buffer as any

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
    <Suspense
      fallback={
        <Box>
          <LinearProgress />
        </Box>
      }
    >
      <CssBaseline />
      <ThemeProvider theme={theme}>
        <RouterProvider router={router} />
      </ThemeProvider>
    </Suspense>
  </QueryClientProvider>

  // </React.StrictMode>
)
