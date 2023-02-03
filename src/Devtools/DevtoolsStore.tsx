import create, { StoreApi, UseBoundStore } from 'zustand'
import { getElementDimensions, Rect } from '../Components/ReactDevInspectorUtils/overlay'

interface DevtoolsStore {
  box?: Rect
  dims?: ReturnType<typeof getElementDimensions>
}

export const useDevtoolsStore: UseBoundStore<StoreApi<DevtoolsStore>> = create<DevtoolsStore>()(
  (set, get) => ({})
)
