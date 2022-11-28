import { type AsyncMethodReturns, connectToParent } from 'penpal'
import type { ParentMethods } from '../Components/Preview/Preview'
import { getElementCodeInfo } from '../Components/ReactDevInspectorUtils/inspect'
import { isEqual } from 'lodash-es'
import { createBridge, initialize } from '../Components/ReactDevtools/react-devtools-inline/backend'
import Agent from '../Components/ReactDevtools/react-devtools-shared/src/backend/agent'
import { initBackend } from '../Components/ReactDevtools/react-devtools-shared/src/backend'
import { useDevtoolsStore } from './DevtoolsStore'
import { getElementDimensions } from '../Components/ReactDevInspectorUtils/overlay'

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
  idFromPoint: async (x?: number, y?: number) => {
    if (x === undefined || y === undefined) return
    const { getAgent } = useDevtoolsStore.getState()
    const agent = getAgent()
    const nodes = document.elementsFromPoint(x, y)
    const node = nodes[0]
    return node && agent.getIDForNode(node)
  },
  elementStyle: async (id: number, rendererId: number) => {
    const { getAgent } = useDevtoolsStore.getState()
    const agent = getAgent()
    const renderer = agent.rendererInterfaces[rendererId]
    const rendererNodes =
      (id && (renderer?.findNativeNodesForFiberID(id) as any as Array<HTMLElement> | null | undefined)) ||
      undefined

    return rendererNodes?.map(
      (v) =>
        ({
          rect: v.getBoundingClientRect(),
          dims: getElementDimensions(v),
        } as const)
    )
  },
  sourceFromId: async (id: number, rendererId: number) => {
    const agent = useDevtoolsStore.getState().getAgent()
    const renderer = agent.rendererInterfaces[rendererId]
    const nativeNodes = renderer.findNativeNodesForFiberID(id)
    return nativeNodes?.map((node) => getElementCodeInfo(node as HTMLElement))
  },
}

export type DevtoolsMethods = typeof devtoolMethods

console.log('Activating devtools', window.__REACT_DEVTOOLS_GLOBAL_HOOK__)
initialize(window)
const connection = connectToParent<ParentMethods>({
  methods: devtoolMethods,
  parentOrigin: '*',
})

connection.promise.then((parentMethods) => {
  console.log('Connected to parent')
  const bridge = createBridge(window)
  const agent = new Agent(bridge)
  const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__
  bridge.emit('startInspectingNative')
  agent.addListener('selectFiber', (v) => console.log('Select fiber', v))
  agent.addListener('showNativeHighlight', (v) => console.log('Show native', v))
  useDevtoolsStore.setState({ bridge, agent })

  if (hook) {
    initBackend(hook, agent, window)
  }

  connectionMethods = parentMethods
})

// const el = document.createElement('div')
// document.body.append(el)
// ReactDOM.createRoot(el as HTMLElement).render(
//   // <React.StrictMode>
//   <DevtoolsOverlay />
//   // </React.StrictMode>
// )
