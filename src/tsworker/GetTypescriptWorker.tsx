import * as monaco from 'monaco-editor'
import { TypeScriptWorker } from './TypeScriptWorker'

export async function getTypescriptWorker() {
  let typeScriptWorker: TypeScriptWorker | undefined = undefined
  while (!typeScriptWorker) {
    try {
      const workerGetter = await monaco.languages.typescript.getTypeScriptWorker()
      typeScriptWorker = (await workerGetter()) as TypeScriptWorker
    } catch (e) {
      console.log('Waiting for typescript', e)
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }
  return typeScriptWorker as TypeScriptWorker
}
