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
  openFile?: CodeInfo
  readFile?: (fileName: string) => Promise<string | undefined>
  panels?: PanelsResponse
}
export const useFileStore = create<FileStoreState>()(
  persist((set) => ({}), { name: 'files', getStorage: () => ({ getItem, setItem, removeItem }) })
)

export const useIframeStore = create<{
  iframe?: HTMLIFrameElement | null
  frontendReady: boolean
  childConnection?: AsyncMethodReturns<Methods>
  rootNode?: Protocol.DOM.Node
  nodesMap?: Map<number, Protocol.DOM.Node>
  expandedIds: string[]
  swProxy?: Remote<ServiceWorkerAPI>
  tsInit?: true
}>(() => ({
  frontendReady: false,
  expandedIds: [],
}))
