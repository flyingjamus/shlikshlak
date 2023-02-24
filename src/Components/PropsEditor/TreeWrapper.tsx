import Tree from '../ReactDevtools/react-devtools-shared/src/devtools/views/Components/Tree'
import { TreeContextController } from '../ReactDevtools/react-devtools-shared/src/devtools/views/Components/TreeContext'
import {
  BridgeContext,
  StoreContext,
} from '../ReactDevtools/react-devtools-shared/src/devtools/views/context'
import { useBridge } from './UseBridge'
import { useStore } from './UseStore'
import { LinearProgress } from '@mui/material'
import { SettingsContextController } from '../ReactDevtools/react-devtools-shared/src/devtools/views/Settings/SettingsContext'
import ThemeProvider from '../ReactDevtools/react-devtools-shared/src/devtools/views/ThemeProvider'

export const TreeWrapper = () => {
  const store = useStore()
  const bridge = useBridge()
  if (!bridge || !store) return <LinearProgress />
  return (
    <BridgeContext.Provider value={bridge}>
      <StoreContext.Provider value={store}>
        <SettingsContextController browserTheme={'light'}>
          <ThemeProvider>
            <TreeContextController>
              <Tree />
            </TreeContextController>
          </ThemeProvider>
        </SettingsContextController>
      </StoreContext.Provider>
    </BridgeContext.Provider>
  )
}
