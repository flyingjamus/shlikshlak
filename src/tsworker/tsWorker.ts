// import * as typescript from 'typescript'
import * as edworker from 'monaco-editor-core/esm/vs/editor/editor.worker'
import type { worker } from 'monaco-editor-core/esm/vs/editor/editor.api'
import { expose } from 'comlink'
import { parse, stringify } from 'flatted'
import { AppTypeScriptWorker } from './TypeScriptWorker'
import { ICreateData } from './ICreateData'
import { TypeScriptWorker } from './monaco.contribution'

console.debug('Inside TS worker')

function createLoggingProxy<T extends object>(target: T): T {
  return new Proxy(target, {
    get(target, prop, receiver) {
      const originalValue = Reflect.get(target, prop, receiver)

      if (typeof originalValue === 'function') {
        return function (...args: any[]) {
          console.log(`Called ${String(prop)} with arguments:`, args)
          return originalValue.apply(target, args)
        }
      }

      return originalValue
    },
  })
}

export function create(ctx: worker.IWorkerContext, createData: ICreateData): TypeScriptWorker {
  console.log('Creating TS worker', ctx, createData)
  // return createLoggingProxy(new AppTypeScriptWorker())
  return new AppTypeScriptWorker()
}

expose({
  init: async (cb: () => void) => {
    cb()
  },
})

self.onmessage = (e) => {
  console.debug('TS worker got message', e)
  edworker.initialize((ctx: worker.IWorkerContext, createData: ICreateData) => {
    return create(ctx, createData)
  })
}
/** Allows for clients to have access to the same version of TypeScript that the worker uses */
// @ts-ignore
// globalThis.ts = typescript.typescript
