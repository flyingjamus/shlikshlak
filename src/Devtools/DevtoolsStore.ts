import create, { StoreApi, UseBoundStore } from 'zustand'
import { AppNode } from './Devtools'

interface DevtoolsStore {
  selectedNode?: AppNode
  highlightedNode?: AppNode
}
export const useDevtoolsStore: UseBoundStore<StoreApi<DevtoolsStore>> = create<DevtoolsStore>()(
  (setState, get) => ({})
)
