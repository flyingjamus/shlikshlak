import { useIframeStore } from '../store'
import { ElementType } from 'react'
import OriginalStore from '../ReactDevtools/react-devtools-shared/src/devtools/store'
export type Element = {
  id: number
  parentID: number
  children: Array<number>
  type: ElementType
  displayName: string | null
  key: number | string | null

  hocDisplayNames: null | Array<string>

  // Should the elements children be visible in the tree?
  isCollapsed: boolean

  // Owner (if available)
  ownerID: number

  // How many levels deep within the tree is this element?
  // This determines how much indentation (left padding) should be used in the Elements tree.
  depth: number

  // How many nodes (including itself) are below this Element within the tree.
  // This property is used to quickly determine the total number of Elements,
  // and the Element at any given index (for windowing purposes).
  weight: number

  // This element is not in a StrictMode compliant subtree.
  // Only true for React versions supporting StrictMode.
  isStrictModeNonCompliant: boolean
}

export interface Store extends Omit<InstanceType<typeof OriginalStore>, 'getElementAtIndex' | 'getElementByID'> {
  getElementAtIndex(index: number): Element | null
  getElementByID(id: number): Element | null
}

export function useStore() {
  return useIframeStore((v) => v.store) as any as Store
}
