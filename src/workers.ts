import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from '../src/tsworker/tsWorker?worker'
import { proxy, wrap } from 'comlink'
import { useIframeStore } from './Components/store'

const tsWorkerInstance = new tsWorker()

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') {
      return new jsonWorker()
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker()
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker()
    }
    if (label === 'typescript' || label === 'javascript') {
      return new Promise((resolve) => {
        const obj = wrap(tsWorkerInstance)
        obj.init(
          proxy(() => {
            console.log('Git init callback')
            useIframeStore.setState({ tsInit: true })
            resolve(tsWorkerInstance)
          })
        )
      })
    }
    return new editorWorker()
  },
}
