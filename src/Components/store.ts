import create from 'zustand'
import { persist } from 'zustand/middleware'
import { del as removeItem, get as getItem, set as setItem } from 'idb-keyval'
import { Methods } from './Preview/xebug/lib/methods'
import { AsyncMethodReturns } from 'penpal'
import Protocol from 'devtools-protocol'
import { Remote } from 'comlink'
import { ServiceWorkerAPI } from '../Shared/serviceWorkerAPI'
import { CodeInfo } from './ReactDevInspectorUtils/inspect'
import { PanelsResponse } from '../Shared/PanelTypes'
import { StateStorage } from 'zustand/middleware/persist'
import { WorkerAdapter } from '../tsworker/workerAdapter'
import { TypeScriptWorker } from '../tsworker/TypeScriptWorker'

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

type IframeStore = {
  iframe?: HTMLIFrameElement | null
  frontendReady: boolean
  childConnection?: AsyncMethodReturns<Methods>
  rootNode?: Protocol.DOM.Node
  nodesMap?: Map<number, Protocol.DOM.Node>
  expandedIds: string[]
  swProxy?: Remote<ServiceWorkerAPI>
  tsInit?: true
  workerAdapter?: WorkerAdapter
  openFile?: OpenFile
  readFile?: (fileName: string) => Promise<string | undefined>
  panels?: PanelsResponse
  tsWorker?: TypeScriptWorker
}
export const useIframeStore = create<IframeStore>()(
  persist<IframeStore>(
    () => ({
      frontendReady: false,
      expandedIds: [],
      openFile: { path: '/src/stories/Header.tsx', columnNumber: 0, lineNumber: 0 },
    }),
    {
      name: 'iframestore',
      getStorage: () => localStorage,
      partialize: ({ openFile }) => ({ openFile } as IframeStore),
    }
  )
)
