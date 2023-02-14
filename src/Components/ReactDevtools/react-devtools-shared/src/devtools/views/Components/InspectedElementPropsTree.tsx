import { copy } from 'clipboard-js'
import * as React from 'react'
import { OptionsContext } from '../context'
import Button from '../Button'
import ButtonIcon from '../ButtonIcon'
import KeyValue from './KeyValue'
import NewKeyValue from './NewKeyValue'
import { alphaSortEntries, serializeDataForCopy } from '../utils'
import Store from '../../store'
import styles from './InspectedElementSharedStyles.module.css'
import { ElementTypeClass } from '../../../types'
import type { InspectedElement } from './types'
import type { FrontendBridge } from '../../../bridge'
import type { Element } from './types'
type Props = {
  bridge: FrontendBridge
  element: Element
  inspectedElement: InspectedElement
  store: Store
}
export default function InspectedElementPropsTree({ bridge, element, inspectedElement, store }: Props) {
  const { readOnly } = React.useContext(OptionsContext)
  const {
    canEditFunctionProps,
    canEditFunctionPropsDeletePaths,
    canEditFunctionPropsRenamePaths,
    props,
    type,
  } = inspectedElement
  const canDeletePaths = type === ElementTypeClass || canEditFunctionPropsDeletePaths
  const canEditValues = !readOnly && (type === ElementTypeClass || canEditFunctionProps)
  const canRenamePaths = type === ElementTypeClass || canEditFunctionPropsRenamePaths
  const entries = props != null ? Object.entries(props) : null

  if (entries !== null) {
    entries.sort(alphaSortEntries)
  }

  const isEmpty = entries === null || entries.length === 0

  const handleCopy = () => copy(serializeDataForCopy(props as any as Record<string, any>))

  return (
    <div className={styles.InspectedElementTree} data-testname="InspectedElementPropsTree">
      <div className={styles.HeaderRow}>
        <div className={styles.Header}>props</div>
        {!isEmpty && (
          <Button onClick={handleCopy} title="Copy to clipboard">
            <ButtonIcon type="copy" />
          </Button>
        )}
      </div>
      {!isEmpty &&
        (entries as any).map(([name, value]) => (
          <KeyValue
            key={name}
            alphaSort={true}
            bridge={bridge}
            canDeletePaths={canDeletePaths}
            canEditValues={canEditValues}
            canRenamePaths={canRenamePaths}
            depth={1}
            element={element}
            hidden={false}
            inspectedElement={inspectedElement}
            name={name}
            path={[name]}
            pathRoot="props"
            store={store}
            value={value}
          />
        ))}
      {canEditValues && (
        <NewKeyValue
          bridge={bridge}
          depth={0}
          hidden={false}
          inspectedElement={inspectedElement}
          path={[]}
          store={store}
          type="props"
        />
      )}
    </div>
  )
}
