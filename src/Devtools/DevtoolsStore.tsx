import create, { StoreApi, UseBoundStore } from 'zustand'
import { getElementDimensions, Rect } from '../Components/ReactDevInspectorUtils/overlay'
import Agent from '../Components/ReactDevtools/react-devtools-shared/src/backend/agent'
import { BackendBridge } from '../Components/ReactDevtools/react-devtools-shared/src/bridge'

interface DevtoolsStore {
  box?: Rect
  dims?: ReturnType<typeof getElementDimensions>
  bridge?: BackendBridge
  agent?: Agent
  getBridge: () => BackendBridge
  getAgent: () => Agent
}

export const useDevtoolsStore: UseBoundStore<StoreApi<DevtoolsStore>> = create<DevtoolsStore>()(
  (set, get) => ({
    getAgent() {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return get().agent!
    },
    getBridge() {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return get().bridge!
    },
  })
)
