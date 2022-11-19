import typescript from 'typescript'
import * as edworker from 'monaco-editor-core/esm/vs/editor/editor.worker'
import type { worker } from 'monaco-editor-core/esm/vs/editor/editor.api'
import { fillCacheFromStore } from './fileGetter'
import { expose } from 'comlink'
import { parse, stringify } from 'flatted'
import { TypeScriptWorker } from './TypeScriptWorker'
import { ICreateData } from './ICreateData'

export function create(ctx: worker.IWorkerContext, createData: ICreateData): TypeScriptWorker {
  console.log('Creating TS worker')
  return new TypeScriptWorker(ctx, createData)
}

expose({
  init: async (cb: () => void) => {
    await fillCacheFromStore()

    cb()
  },
})

self.onmessage = () => {
  edworker.initialize((ctx: worker.IWorkerContext, createData: ICreateData) => {
    return create(ctx, createData)
  })
}
/** Allows for clients to have access to the same version of TypeScript that the worker uses */
// @ts-ignore
globalThis.ts = typescript.typescript

