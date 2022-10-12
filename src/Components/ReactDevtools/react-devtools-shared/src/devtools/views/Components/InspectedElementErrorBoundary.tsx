import * as React from 'react'
import { useCallback, useContext } from 'react'
import ErrorBoundary from '../ErrorBoundary'
import { TreeStateContext } from './TreeContext'
import { clearCacheBecauseOfError } from '../../../inspectedElementCache'
import styles from './InspectedElementErrorBoundary.module.css'
import { useCacheRefresh } from '../../../../../react-debug-tools/src/ReactDebugHooks'
type WrapperProps = {
  children: React.ReactNode
}
export default function InspectedElementErrorBoundaryWrapper({ children }: WrapperProps) {
  // Key on the selected element ID so that changing the selected element automatically hides the boundary.
  // This seems best since an error inspecting one element isn't likely to be relevant to another element.
  const { selectedElementID } = useContext(TreeStateContext)
  const refresh = useCacheRefresh()
  const handleDsmiss = useCallback(() => {
    clearCacheBecauseOfError(refresh)
  }, [refresh])
  return (
    <div className={styles.Wrapper}>
      <ErrorBoundary key={selectedElementID} canDismiss={true} onBeforeDismissCallback={handleDsmiss}>
        {children}
      </ErrorBoundary>
    </div>
  )
}
