import { Fiber } from 'react-reconciler'

declare global {
  interface Window {
    __shlikshlak__: {
      getDisplayNameForFiber(fiber: Fiber): string | null
    }
  }
}
