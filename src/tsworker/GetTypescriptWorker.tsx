import * as monaco from 'monaco-editor'
import { TypeScriptWorker } from './tsWorker'

export async function getTypescriptWorker() {
  const workerGetter = await monaco.languages.typescript.getTypeScriptWorker()
  return (await workerGetter()) as TypeScriptWorker
}
