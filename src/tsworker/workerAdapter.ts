import { TypeScriptWorker } from './tsWorker'

export class WorkerAdapter {
  constructor(private worker: TypeScriptWorker) {}

  async setAttribute(prop: string, value: string) {
    const edits = await worker.setAttributeAtPosition(uriString, offset, 'size', 'AAAAA')
    console.log(edits)
    function textSpanToRange(model: editor.ITextModel, span: typescript.TextSpan): IRange {
      const p1 = model.getPositionAt(span.start)
      const p2 = model.getPositionAt(span.start + span.length)
      const { lineNumber: startLineNumber, column: startColumn } = p1
      const { lineNumber: endLineNumber, column: endColumn } = p2
      return { startLineNumber, startColumn, endLineNumber, endColumn }
    }

    if (edits) {
      const editOperations = edits.map((v) => ({
        range: textSpanToRange(model, v.span),
        text: v.newText,
      }))
      console.log(editOperations, edits)
      model.pushEditOperations(null, editOperations, (inverseEditOperations) => null)
    }
  }
}
