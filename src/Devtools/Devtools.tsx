import { type AsyncMethodReturns, connectToParent } from 'penpal'
import type { ParentMethods } from '../Components/Preview/Preview'
import { CodeInfo, getElementCodeInfo } from '../Components/ReactDevInspectorUtils/inspect'
import { isEqual } from 'lodash-es'
import { Fiber } from '../Components/ReactDevtools/react-reconciler/src/ReactInternalTypes'
import { createBridge, initialize } from '../Components/ReactDevtools/react-devtools-inline/backend'
import Agent from '../Components/ReactDevtools/react-devtools-shared/src/backend/agent'
import { initBackend } from '../Components/ReactDevtools/react-devtools-shared/src/backend'
import { setupHighlighter } from '../Components/ReactDevInspectorUtils/highlight'
import ReactDOM from 'react-dom/client'
import { DevtoolsOverlay } from './DevtoolsOverlay'
import { PreviewOverlay } from './PreviewOverlay'
import { useDevtoolsStore } from './DevtoolsStore'

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
  highlightPoint: async ({ clientX, clientY }: { clientX: number; clientY: number }) => {
    const { getBridge, getAgent } = useDevtoolsStore.getState()
    const agent = getAgent()
    const nodes = document.elementsFromPoint(clientX, clientY)
    const node = nodes[1]
    const id = node && agent.getIDForNode(node)
    const renderer = agent.getBestMatchingRendererInterface(node)
    const rendererNodes =
      id && (renderer?.findNativeNodesForFiberID(id) as any as Array<HTMLElement> | null | undefined)
    // return { id, computedStyle:  }
  },
}

export type DevtoolsMethods = typeof devtoolMethods

console.log('Activating devtools', window.__REACT_DEVTOOLS_GLOBAL_HOOK__)
initialize(window)
if (typeof window !== 'undefined') {
  const connection = connectToParent<ParentMethods>({
    methods: devtoolMethods,
    parentOrigin: '*',
  })

  const bridge = createBridge(window)
  const agent = new Agent(bridge)
  const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__
  bridge.emit('startInspectingNative')
  agent.addListener('selectFiber', (v) => console.log('Select fiber', v))
  agent.addListener('showNativeHighlight', (v) => console.log('Show native', v))

  connection.promise.then((parentMethods) => {
    console.log('Connected to parent')
    const bridge = createBridge(window)
    const agent = new Agent(bridge)
    const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__
    bridge.emit('startInspectingNative')
    agent.addListener('selectFiber', (v) => console.log('Select fiber', v))
    agent.addListener('showNativeHighlight', (v) => console.log('Show native', v))
    useDevtoolsStore.setState({ bridge, agent })

    // setupHighlighter({
    //   onClick: (element) => {
    //     console.log(321312321, element, agent.getIDForNode(element))
    //   },
    // })

    if (hook) {
      initBackend(hook, agent, window)
    }

    connectionMethods = parentMethods

    let selectedElement: Element | null = null
    let selectedFiber: Fiber | null = null
    let selectedCodeInfo: CodeInfo | undefined = undefined
    // window.addEventListener('mousemove', async (e) => {
    //   const element = document.elementFromPoint(e.clientX, e.clientY)
    // })
    // window.addEventListener('click', async (e) => {
    //   e.preventDefault()
    //   e.stopImmediatePropagation()
    //
    //   const element = document.elementFromPoint(e.clientX, e.clientY)
    //   console.log('Click', element)
    //   if (!element) return
    //   let fiber: Fiber | null = getElementFiberUpward(element)
    //   let codeInfo: CodeInfo | undefined
    //
    //   let node = element
    //   while (node) {
    //     console.log(agent.getIDForNode(node))
    //     node = node.parentNode
    //   }
    //
    //   if (element === selectedElement) {
    //     let found = false
    //     while (fiber) {
    //       codeInfo = getCodeInfoFromFiber(fiber)
    //
    //       const name = getComponentNameFromFiber(fiber)
    //       if (codeInfo) {
    //         if (isEqual(codeInfo, selectedCodeInfo)) {
    //           found = true
    //         } else {
    //           if (found) {
    //             fiber = null
    //             continue
    //           }
    //         }
    //       }
    //       fiber = fiber?.return
    //     }
    //   } else {
    //     codeInfo = getCodeInfoFromFiber(fiber)
    //   }
    //
    //   if (codeInfo) {
    //     await parentMethods.setReactFileLocation(codeInfo)
    //   }
    //   selectedFiber = fiber
    //   selectedElement = element
    //   selectedCodeInfo = codeInfo
    // })
  })
}

const el = document.createElement('div')
document.body.append(el)
ReactDOM.createRoot(el as HTMLElement).render(
  // <React.StrictMode>
  // <DevtoolsOverlay />
  <PreviewOverlay />
  // </React.StrictMode>
)
