import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
// import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
// import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
// import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import TsWorker from '../src/tsworker/tsWorker?worker'
import { proxy, wrap } from 'comlink'

import { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'

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
  getWorker(v, label) {
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
      return new TsWorker()
    }
    return new editorWorker()
  },
}

loader.config({ monaco })

loader.init()
