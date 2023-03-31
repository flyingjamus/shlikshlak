import create, { StoreApi, UseBoundStore } from 'zustand'
import { persist } from 'zustand/middleware'
import { del as removeItem, get as getItem, set as setItem } from 'idb-keyval'
import { AsyncMethodReturns } from 'penpal'
import type { Remote } from 'comlink'
import { ServiceWorkerAPI } from '../Shared/serviceWorkerAPI'
import { PanelsResponse } from '../Shared/PanelTypes'
import { StateStorage } from 'zustand/middleware/persist'
import type { DevtoolsMethods } from '../Devtools/Devtools'
import type { editor } from 'monaco-editor'
import { FrontendBridge } from './ReactDevtools/react-devtools-shared/src/bridge'
import Store from './ReactDevtools/react-devtools-shared/src/devtools/store'
import { FileTextChanges } from 'typescript'
import { inspectElement } from './PropsEditor/InspectElement'
import { Source } from './ReactDevtools/react-devtools-shared/shared/ReactElementType'

export type AppFile = {
  path: string
  code: string
  hidden?: boolean
  active?: boolean
  readOnly?: boolean
}

export type FilesMap = Record<string, AppFile>

export type FileStoreState = {
  files?: FilesMap
  allFiles?: Record<string, boolean>
}

const storage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    // console.log(name, 'has been retrieved')
    return (await getItem(name)) || null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    // console.log(name, 'with value', value, 'has been saved')
    await setItem(name, value)
  },
  removeItem: async (name: string): Promise<void> => {
    // console.log(name, 'has been deleted')
    await removeItem(name)
  },
}
export const useFileStore = create<FileStoreState>()(
  persist((set) => ({}), { name: 'files', getStorage: () => storage })
)

export type OpenFile = {
  lineNumber: number
  columnNumber: number
  path: string
}

interface IframeStore {
  iframe?: HTMLIFrameElement | null
  frontendReady: boolean
  childConnection?: AsyncMethodReturns<DevtoolsMethods>
  bridge: FrontendBridge
  store: Store
  expandedIds: string[]
  swProxy?: Remote<ServiceWorkerAPI>
  openFile?: OpenFile
  readFile?: (fileName: string) => Promise<string | undefined>
  panels?: PanelsResponse
  editor?: editor.IStandaloneCodeEditor
  getEditor: () => editor.IStandaloneCodeEditor
  selectedComponent?: OpenFile
  selectedFiberId?: number
  selectedFiberSource?: Source | null
  undoStack: { undoChanges: FileTextChanges[] }[]
  redoStack: { undoChanges: FileTextChanges[] }[]
  methods: {
    selectFiber: (id: number) => Promise<void>
  }
}
export const useIframeStore: UseBoundStore<StoreApi<IframeStore>> = create<IframeStore>()(
  persist<IframeStore>(
    (setState, getState) => ({
      frontendReady: false,
      expandedIds: [],
      openFile: { path: '/src/stories/Header.tsx', columnNumber: 0, lineNumber: 0 },
      getEditor() {
        const editor = getState().editor
        if (!editor) throw new Error('Editor not found')
        return editor
      },
      renderers: {},
      undoStack: [],
      redoStack: [],

      bridge: undefined as any,
      store: undefined as any,

      methods: {
        selectFiber: async (id) => {
          setState({ selectedFiberId: id })

          if (id) {
            const { bridge, store } = getState()
            const result = await inspectElement({ id, bridge, store })

            bridge.send('getFiberIdForSourceLocation', {
              rootIDToRendererID: store.rootIDToRendererID,
            })

            if (result.type === 'full-data') {
              setState({ selectedFiberSource: result.value.source || null })
            }
          } else {
            setState({ selectedFiberSource: null })
          }
        },
      },
    }),
    {
      name: 'iframestore',
      getStorage: () => localStorage,
      partialize: ({ openFile, selectedComponent, undoStack }) =>
        ({ openFile, selectedComponent, undoStack } as IframeStore),
    }
  )
)

export const useIframeMethods = () => useIframeStore((v) => v.methods)

window.__shlikshlack__ = Object.assign(window.__shlikshlack__ || {}, {
  clearUndoHistory: () => {
    useIframeStore.setState({ undoStack: [], redoStack: [] })
  },
})
