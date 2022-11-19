import { FileStoreState } from '../Components/store'

export type ServiceWorkerAPI = {
  init: (v: FileStoreState) => void
}
