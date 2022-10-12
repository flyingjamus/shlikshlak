import * as React from 'react'
import KeyValue from './KeyValue'
import Store from '../../store'
import sharedStyles from './InspectedElementSharedStyles.module.css'
import styles from './InspectedElementStyleXPlugin.module.css'
import type { Element, InspectedElement } from './types'
import type { FrontendBridge } from '../../../bridge'

type Props = {
  bridge: FrontendBridge
  element: Element
  inspectedElement: InspectedElement
  store: Store
}

const enableStyleXFeatures = false
export default function InspectedElementStyleXPlugin({ bridge, element, inspectedElement, store }: Props) {
  if (!enableStyleXFeatures) {
    return null
  }

  const styleXPlugin = inspectedElement.plugins.stylex

  if (styleXPlugin == null) {
    return null
  }

  const { resolvedStyles, sources } = styleXPlugin
  return (
    <div className={sharedStyles.InspectedElementTree}>
      <div className={sharedStyles.HeaderRow}>
        <div className={sharedStyles.Header}>stylex</div>
      </div>
      {sources.map((source) => (
        <div key={source} className={styles.Source}>
          {source}
        </div>
      ))}
      {Object.entries(resolvedStyles).map(([name, value]) => (
        <KeyValue
          key={name}
          alphaSort={true}
          bridge={bridge}
          canDeletePaths={false}
          canEditValues={false}
          canRenamePaths={false}
          depth={1}
          element={element}
          hidden={false}
          inspectedElement={inspectedElement}
          name={name}
          path={[name]}
          pathRoot="stylex"
          store={store}
          value={value}
        />
      ))}
    </div>
  )
}
