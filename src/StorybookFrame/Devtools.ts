import isEqual from 'lodash-es/isEqual'
import { type AsyncMethodReturns, connectToParent } from 'penpal'
// import methods from '../Components/Preview/xebug/lib/methods'
import type { parentMethods } from '../Components/Preview/Preview'
import { getElementCodeInfo } from '../Components/ReactDevInspectorUtils/inspect'
import { activate } from '../Components/ReactDevtools/react-devtools-inline/backend'

console.debug('Inside devtools')
type ParentMethods = typeof parentMethods
let connectionMethods: AsyncMethodReturns<ParentMethods> | undefined = undefined
if (typeof window !== 'undefined') {
  const connection = connectToParent<ParentMethods>({
    methods: {
      init: () => {
        console.log('Activating devtools')
        activate(window)
        addEventListener('click', (e) => {
          e.preventDefault()
          e.stopImmediatePropagation()

          const node = document.elementFromPoint(e.clientX, e.clientY)
          console.log('Click', node)
          if (!node) return

          const codeInfo = getElementCodeInfo(node)
          console.log(codeInfo)

          if (codeInfo) {
            parentConnection().setReactFileLocation(codeInfo)
          }
        })
      },
    },
    parentOrigin: '*',
  })

  connection.promise.then((v) => {
    connectionMethods = v
  })
}

export const parentConnection = (): ParentMethods => {
  if (!connectionMethods) {
    throw new Error('Connection methods missing')
  }
  return connectionMethods
}
