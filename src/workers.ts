import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
// import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
// import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
// import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import TsWorker from '../src/tsworker/tsWorker?worker'
import { proxy, wrap } from 'comlink'
import { memoize } from 'lodash-es'

const tsWorker = memoize(() => new TsWorker())

export function initTsWorker(tsWorker: Worker) {
  return new Promise<Worker>((resolve) => {
    const obj = wrap<{ init: (cb: () => void) => Promise<unknown> }>(tsWorker)
    obj.init(
      proxy(async () => {
        resolve(tsWorker)
      })
    )
  })
}

self.MonacoEnvironment = {
  getWorker(_, label) {
    // if (label === 'json') {
    //   return new jsonWorker()
    // }
    // if (label === 'css' || label === 'scss' || label === 'less') {
    //   return new cssWorker()
    // }
    // if (label === 'html' || label === 'handlebars' || label === 'razor') {
    //   return new htmlWorker()
    // }
    if (label === 'typescript' || label === 'javascript') {
      console.debug('Creating TS worker')
      return initTsWorker(tsWorker())
    }
    return new editorWorker()
  },
}
