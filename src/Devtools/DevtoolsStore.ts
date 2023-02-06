import create, { StoreApi, UseBoundStore } from 'zustand'

interface DevtoolsStore {
  selectedId?: number
  highlightedId?: number
}
export const useDevtoolsStore: UseBoundStore<StoreApi<DevtoolsStore>> = create<DevtoolsStore>()(
  (setState, get) => ({})
)
