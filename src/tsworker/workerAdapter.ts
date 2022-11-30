import PQueue from 'p-queue'
import type { editor, IRange } from 'monaco-editor'
import { TextSpan } from 'typescript'
import { monaco } from 'react-monaco-editor'
import { TypeScriptWorker } from './TypeScriptWorker'

const attributesQueues: Record<string, PQueue> = {}
// const nextAttributesValues: Map<string, AttributeValue> = new Map()
const modelCbs: Record<string, (() => void) | undefined> = {}

monaco.editor.onDidCreateModel((model) => {
  const changeSubscription = model.onDidChangeContent((e) => {
    const cb = modelCbs[model.uri.toString()]
    if (cb) {
      modelCbs[model.uri.toString()] = undefined
      cb()
    }
  })
})

function textSpanToRange(model: editor.ITextModel, span: TextSpan): IRange {
  const p1 = model.getPositionAt(span.start)
  const p2 = model.getPositionAt(span.start + span.length)
  const { lineNumber: startLineNumber, column: startColumn } = p1
  const { lineNumber: endLineNumber, column: endColumn } = p2
  return { startLineNumber, startColumn, endLineNumber, endColumn }
}

type AttributeValue = string | boolean | undefined

window.onunhandledrejection = () => {
  console.log('Unhandled')
}
export class WorkerAdapter {
  constructor(private worker: TypeScriptWorker) {
    worker.init()
  }

  async setAttribute(fileName: string, location: number, prop: string, value: AttributeValue) {
    attributesQueues[fileName] ||= new PQueue({ concurrency: 1 })
    const p = attributesQueues[fileName]
    p.clear()
    console.log(fileName, prop, value)
    p.add(async ({}) => {
      if (modelCbs[fileName]) {
        console.error('Callback already there')
        return
      }

      const fileEdits = await this.worker.setAttributeAtPosition(fileName, location, prop, value)

      if (!fileEdits?.length) {
        return
      }

      const cbPromise = new Promise<void>((resolve) => {
        const cb = () => resolve()
        setTimeout(() => {
          if (modelCbs[fileName] === cb) {
            console.error('No CB after timeout')
            modelCbs[fileName] = undefined
            cb()
          }
          resolve()
        }, 5000)
        modelCbs[fileName] = cb
      })
      fileEdits.forEach((file) => {
        const uri = monaco.Uri.parse(file.fileName)
        const model = monaco.editor.getModel(uri)
        if (!model) return
        const editOperations = file.textChanges.map((v) => ({
          range: textSpanToRange(model, v.span),
          text: v.newText,
        }))
        model.pushEditOperations([], editOperations, (inverseEditOperations) => {
          return null
        })
      })
      await cbPromise
    })
  }
}
