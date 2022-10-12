import * as tsWorkerModule from '../src/tsworker/tsWorker'
// import * as tsWorkerModule from 'monaco-editor/esm/vs/language/typescript/ts.worker'
import { languages } from 'monaco-editor'
import * as ts from 'typescript'
// import TypeScriptWorker = languages.typescript.TypeScriptWorker

console.log(13231132, tsWorkerModule)
const tsWorker = tsWorkerModule.TypeScriptWorker.prototype as languages.typescript.TypeScriptWorker
// console.log()
// tsWorker.getCompletionsAtPosition = (fileName, position) =>  {
//   console.log(this)
//   return old.call(this, fileName, position)
// }

const proxy = <M extends keyof typeof tsWorker>(methodName: M) => {
  const old = tsWorker[methodName]
  tsWorker[methodName] = function (...params: Parameters<typeof tsWorker[M]>) {
    console.log('INSIDE', methodName, params)
    // @ts-ignore
    const res = (old as any).apply(this as any, params) as ReturnType<typeof tsWorker[M]>
    console.log('RESULT', res)
    return res
  } as any
}
// proxy('readFile')
//
// const res = []
// function logAllProperties(obj) {
//   if (obj == null) return // recursive approach
//   for (const prop of Object.getOwnPropertyNames(obj)) {
//     // if (prop.toLowerCase().includes('file')) {
//       res.push(prop)
//     // }
//   }
//   logAllProperties(Object.getPrototypeOf(obj))
// }
// logAllProperties(tsWorker)
// console.log(res)

// "_getModel",
// "getScriptText",

// "getExtraLibs",
// "getScriptFileNames",
// "getScriptVersion",
// "_getScriptText",
// "getScriptSnapshot",
// "getScriptKind",
// "getCurrentDirectory",
// "getDefaultLibFileName",
// "isDefaultLibFileName",
// "getLibFiles",

// proxy('getCurrentDirectory')
// proxy('getScriptSnapshot')
// proxy('getLibFiles')

// proxy('directoryExists')
// console.log()
// const oldFileExists = tsWorker.fileExists

const cache: Record<string, string | undefined> = {}
function readPath(path: string) {
  if (path in cache) return cache[path]
  const req = new XMLHttpRequest()
  // req.addEventListener("load", reqListener);
  try {
    const url = 'http://localhost:3001' + (path.startsWith('file://') ? path.slice('file://'.length) : path)
    // console.log(url)
    req.open('GET', url, false)

    req.send()
    // console.log(req.status)
    // console.log(req.responseText)
    if (req.status !== 200) {
      cache[path] = undefined
      return
    }
    const responseText = req.responseText
    cache[path] = responseText
    return responseText
  } catch (e) {
    return
  }
}

tsWorker.fileExists = function (path: string) {
  return !!readPath(path)
}

tsWorker.readFile = function (path: string) {
  return readPath(path)
}

tsWorker.directoryExists = function (path: string) {
  return !!readPath(path)
}

const oldGetScriptText = tsWorker._getScriptText
tsWorker._getScriptText = function (path: string) {
  const res = oldGetScriptText.call(this, path)
  return res || readPath(path)
}
console.log(tsWorker)
// proxy('_getScriptText')

// const oldGetSemanticDiagnostics = tsWorker.getSemanticDiagnostics
// tsWorker.getSemanticDiagnostics = async function (fileName) {
//   const res = await oldGetSemanticDiagnostics.call(this, fileName)
//   return res
// }
//
// const oldGetCodeFixesAtPosition = tsWorker.getCodeFixesAtPosition
// tsWorker.getCodeFixesAtPosition = function (fileName, start, end, errorCodes, formatOptions) {
//   return oldGetCodeFixesAtPosition.call(this, fileName, start, end, errorCodes, formatOptions)
// }

// console.log(tsWorker.prototype.constructor);

export default {
  ...tsWorkerModule,
}
