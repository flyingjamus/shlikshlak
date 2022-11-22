import { type AsyncMethodReturns, connectToParent } from 'penpal'
import type { ParentMethods, parentMethods } from '../Components/Preview/Preview'
import { getElementCodeInfo } from '../Components/ReactDevInspectorUtils/inspect'
import { isEqual } from 'lodash-es'
import { getElementFiberUpward } from '../Components/ReactDevInspectorUtils/fiber'
import { Fiber } from '../Components/ReactDevtools/react-reconciler/src/ReactInternalTypes'
import getComponentNameFromFiber from '../Components/ReactDevtools/react-reconciler/src/getComponentNameFromFiber'

console.debug('Inside devtools')

let connectionMethods: AsyncMethodReturns<ParentMethods> | undefined = undefined

const devtoolMethods = {
  init: () => {},
  getCodeInfoFromPoint: ({
    clientX,
    clientY,
    depth = 1,
  }: {
    clientX: number
    clientY: number
    depth?: number
  }) => {
    const nodes = document.elementsFromPoint(clientX, clientY)
    const node = nodes[0]
    if (!nodes) return

    let remainingDepth = depth
    let codeInfo = getElementCodeInfo(node)
    let currentNode: HTMLElement | null = node
    while (currentNode && codeInfo && remainingDepth) {
      currentNode = currentNode.parentElement
      const newCodeInfo = getElementCodeInfo(currentNode!)
      if (!isEqual(newCodeInfo, codeInfo)) {
        remainingDepth--
        codeInfo = newCodeInfo
      }
    }

    return codeInfo
  },
  highlightPoint: async ({
    clientX,
    clientY,
    depth = 0,
  }: {
    clientX: number
    clientY: number
    depth?: number
  }) => {
    const node = document.elementFromPoint(clientX, clientY)
    if (!node) return
    const codeInfo = getElementCodeInfo(node)
  },
}

export type DevtoolsMethods = typeof devtoolMethods

if (typeof window !== 'undefined') {
  const connection = connectToParent<ParentMethods>({
    methods: devtoolMethods,
    parentOrigin: '*',
  })

  connection.promise.then((parentMethods) => {
    console.log('Connected to parent')
    connectionMethods = parentMethods

    window.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopImmediatePropagation()

      const node = document.elementFromPoint(e.clientX, e.clientY)
      console.log('Click', node)
      if (!node) return
      let remainingDepth = 1
      let codeInfo = getElementCodeInfo(node)
      let currentNode: HTMLElement | null = node
      let fiber: Fiber | undefined = getElementFiberUpward(node)
      while (fiber) {
        const name = getComponentNameFromFiber(fiber)
        if (name?.startsWith('Styled')) {
          console.log(fiber, 1323112321)
        }
        fiber = fiber.return
      }
      try {
        while (currentNode && codeInfo && remainingDepth) {
          const newCodeInfo = getElementCodeInfo(currentNode!)
          if (!isEqual(newCodeInfo, codeInfo)) {
            remainingDepth--
            codeInfo = newCodeInfo
          } else {
            currentNode = currentNode.parentElement
          }
        }
      } catch (e) {
        console.log(33333, e)
      }
    })
  })
}

export const parentConnection = (): ParentMethods => {
  if (!connectionMethods) {
    throw new Error('Connection methods missing')
  }
  return connectionMethods
}
