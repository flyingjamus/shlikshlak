import * as React from 'react'
import { OptionsContext } from '../context'
import EditableValue from './EditableValue'
import Store from '../../store'
import { ElementTypeSuspense } from '../../../types'
import styles from './InspectedElementSharedStyles.module.css'
import type { InspectedElement } from './types'
import type { FrontendBridge } from '../../../bridge'
type Props = {
  bridge: FrontendBridge
  inspectedElement: InspectedElement
  store: Store
}
export default function InspectedElementSuspenseToggle({ bridge, inspectedElement, store }: Props) {
  const { readOnly } = React.useContext(OptionsContext)
  const { id, state, type } = inspectedElement
  const canToggleSuspense = !readOnly && inspectedElement.canToggleSuspense

  if (type !== ElementTypeSuspense) {
    return null
  }

  const isSuspended = state !== null

  const toggleSuspense = (path, value) => {
    const rendererID = store.getRendererIDForElement(id)

    if (rendererID !== null) {
      bridge.send('overrideSuspense', {
        id,
        rendererID,
        forceFallback: value,
      })
    }
  }

  return (
    <div className={styles.InspectedElementTree}>
      <div className={styles.HeaderRow}>
        <div className={styles.Header}>suspense</div>
      </div>
      <div className={styles.ToggleSuspenseRow}>
        <span className={styles.Name}>Suspended</span>
        {canToggleSuspense ? ( // key is required to keep <EditableValue> and header row toggle button in sync
          <EditableValue
            key={isSuspended}
            overrideValue={toggleSuspense}
            path={['suspense', 'Suspended']}
            value={isSuspended}
          />
        ) : (
          <span className={styles.Value}>{isSuspended ? 'true' : 'false'}</span>
        )}
      </div>
    </div>
  )
}
