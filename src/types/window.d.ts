import type Buffer from 'buffer/'
interface Window {
  __DEV__: boolean
  __shlikshlack__: {
    clearUndoHistory: () => void
  }
  Buffer: Buffer
}
