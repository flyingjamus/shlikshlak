import create, { StoreApi, UseBoundStore } from 'zustand'
import { persist } from 'zustand/middleware'
import { del as removeItem, get as getItem, set as setItem } from 'idb-keyval'
import { AsyncMethodReturns } from 'penpal'
import type { Remote } from 'comlink'
import { ServiceWorkerAPI } from '../Shared/serviceWorkerAPI'
import { PanelsResponse } from '../Shared/PanelTypes'
import { StateStorage } from 'zustand/middleware/persist'
import { TypeScriptWorker } from '../tsworker/TypeScriptWorker'
import type { AppNode, DevtoolsMethods } from '../Devtools/Devtools'
import type { editor } from 'monaco-editor'

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
  expandedIds: string[]
  swProxy?: Remote<ServiceWorkerAPI>
  openFile?: OpenFile
  readFile?: (fileName: string) => Promise<string | undefined>
  panels?: PanelsResponse
  tsWorker?: TypeScriptWorker
  editor?: editor.IStandaloneCodeEditor
  getEditor: () => editor.IStandaloneCodeEditor
  selectedComponent?: OpenFile
  hoveringComponent?: { x: number; y: number }
  elementsStack?: AppNode[]
}
export const useIframeStore: UseBoundStore<StoreApi<IframeStore>> = create<IframeStore>()(
  persist<IframeStore>(
    (setState, get) => ({
      frontendReady: false,
      expandedIds: [],
      openFile: { path: '/src/stories/Header.tsx', columnNumber: 0, lineNumber: 0 },
      getEditor() {
        const editor = get().editor
        if (!editor) throw new Error('Editor not found')
        return editor
      },
      renderers: {},
    }),
    {
      name: 'iframestore',
      getStorage: () => localStorage,
      partialize: ({ openFile, selectedComponent }) => ({ openFile, selectedComponent } as IframeStore),
    }
  )
)
