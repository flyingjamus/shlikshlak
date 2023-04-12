import { type AsyncMethodReturns, connectToParent } from 'penpal'
import type { ParentMethods } from '../Components/Preview/Preview'
import { CodeInfo, getCodeInfoFromFiber, getReferenceFiber } from './ReactDevInspectorUtils/inspect'
import { getElementDimensions } from './ReactDevInspectorUtils/overlay'
import { uniqueId } from 'lodash-es'
import { getElementFiber } from './ReactDevInspectorUtils/fiber'
import type { Fiber } from 'react-reconciler'
import { isDefined } from 'ts-is-defined'
import { activate } from '../Components/ReactDevtools/react-devtools-inline/backend'

const s = window.__shlikshlak__

export type AppNode = {
  id: number
  index: number
  key: string | null
  tag: number
  displayName?: string | null
  parentId?: number | null
  codeInfo?: CodeInfo
}
const fiberCache: WeakMap<Fiber, AppNode> = new WeakMap()
const nodeMap = new Map<number, AppNode>()
const fiberMap = new Map<number, Fiber>() // TODO memory leaks prob

function fiberToNode(fiber?: Fiber) {
  if (!fiber) return
  if (fiber && !fiberCache.has(fiber)) {
    const { index, key, tag, type } = fiber
    const id = +uniqueId()

    // const parentFiber = getDirectParentFiber(fiber)
    const parentFiber = fiber.return
    const referenceFiber = getReferenceFiber(fiber)
    const node: AppNode = {
      id,
      index,
      key,
      tag,
      displayName: s.getDisplayNameForFiber(fiber),
      parentId: parentFiber && fiberToNode(parentFiber)?.id,
      codeInfo: getCodeInfoFromFiber(fiber),
    }

    fiberCache.set(fiber, node)
    nodeMap.set(id, node)
    fiberMap.set(id, fiber)
  }

  return fiberCache.get(fiber)!
}

export async function getNode(id: number): Promise<AppNode | undefined> {
  return nodeMap.get(id)
}

export function getDomNodeById(id: number) {
  return fiberMap.get(id)?.stateNode
}

export function getNodeFromElement(element: Element) {
  return fiberToNode(getElementFiber(element as any))
}

let connectionMethods: AsyncMethodReturns<ParentMethods> | undefined = undefined

const devtoolMethods = {
  init: () => {},
  highlight: () => {
    console.log(1232132)
  },
  nodesFromPoint: async (x: number, y: number) => {
    const nodes = document.elementsFromPoint(x, y)
    return nodes.map((v) => getNodeFromElement(v)).filter(isDefined)
  },
  getNodeById: (id: number) => {
    return getNode(id)
  },
  getAncestors: async (id: number) => {
    let parent: AppNode | null | undefined = await getNode(id)
    const res: AppNode[] = []
    // TODO id StoryRoot better
    while (parent && parent.displayName !== 'StoryRoot') {
      res.push(parent)
      parent = (parent.parentId && (await devtoolMethods.getNodeById(parent.parentId))) || undefined
    }
    return res
  },
  elementStyle: async (id: number) => {
    const domNode: Element = getDomNodeById(id)
    return domNode ? [{ rect: domNode.getBoundingClientRect(), dims: getElementDimensions(domNode) }] : []
  },
  sourceFromId: async (id: number) => {
    const fiber = fiberMap.get(id)
    const referenceFiber = getReferenceFiber(fiber)
    return getCodeInfoFromFiber(referenceFiber)
  },
}

export type DevtoolsMethods = typeof devtoolMethods

const connection = connectToParent<ParentMethods>({
  methods: devtoolMethods,
  parentOrigin: '*',
})

connection.promise.then((parentMethods) => {
  console.log('Connected to parent')
  const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__
  activate(window)

  connectionMethods = parentMethods
})
