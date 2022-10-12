import { copy } from 'clipboard-js'
import * as React from 'react'
import Button from '../Button'
import ButtonIcon from '../ButtonIcon'
import KeyValue from './KeyValue'
import { alphaSortEntries, serializeDataForCopy } from '../utils'
import Store from '../../store'
import styles from './InspectedElementSharedStyles.module.css'
import { ElementTypeClass, ElementTypeFunction } from '../../../types'
import type { InspectedElement } from './types'
import type { FrontendBridge } from '../../../bridge'
import type { Element } from './types'
type Props = {
  bridge: FrontendBridge
  element: Element
  inspectedElement: InspectedElement
  store: Store
}
export default function InspectedElementContextTree({ bridge, element, inspectedElement, store }: Props) {
  const { hasLegacyContext, context, type } = inspectedElement
  const isReadOnly = type !== ElementTypeClass && type !== ElementTypeFunction
  const entries = context != null ? Object.entries(context) : null

  if (entries !== null) {
    entries.sort(alphaSortEntries)
  }

  const isEmpty = entries === null || entries.length === 0

  const handleCopy = () => copy(serializeDataForCopy(context as any as Record<string, any>))

  // We add an object with a "value" key as a wrapper around Context data
  // so that we can use the shared <KeyValue> component to display it.
  // This wrapper object can't be renamed.
  const canRenamePathsAtDepth = (depth) => depth > 1

  if (isEmpty) {
    return null
  } else {
    return (
      <div className={styles.InspectedElementTree}>
        <div className={styles.HeaderRow}>
          <div className={styles.Header}>{hasLegacyContext ? 'legacy context' : 'context'}</div>
          {!isEmpty && (
            <Button onClick={handleCopy} title="Copy to clipboard">
              <ButtonIcon type="copy" />
            </Button>
          )}
        </div>
        {isEmpty && <div className={styles.Empty}>None</div>}
        {!isEmpty &&
          (entries as any).map(([name, value]) => (
            <KeyValue
              key={name}
              alphaSort={true}
              bridge={bridge}
              canDeletePaths={!isReadOnly}
              canEditValues={!isReadOnly}
              canRenamePaths={!isReadOnly}
              canRenamePathsAtDepth={canRenamePathsAtDepth}
              depth={1}
              element={element}
              hidden={false}
              inspectedElement={inspectedElement}
              name={name}
              path={[name]}
              pathRoot="context"
              store={store}
              type="context"
              value={value}
            />
          ))}
      </div>
    )
  }
}
