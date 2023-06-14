import * as Y from 'yjs'

export function getSubdoc(doc: Y.Doc, path: string) {
  const map = doc.getMap<Y.Doc>('files')

  if (!map.has(path)) {
    const newDoc = new Y.Doc()
    map.set(path, newDoc)
  }
  return map.get(path)!
}
