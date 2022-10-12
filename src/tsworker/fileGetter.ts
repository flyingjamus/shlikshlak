import { createStore, get, set, entries, keys, clear } from 'idb-keyval'

const store = createStore('db2', 'file-cache-1')
// clear(store)
const cache: Record<string, string | undefined> = {}

export async function fillCacheFromStore() {
  const storeEntries = await entries<string, { responseText?: string }>(store)
  for (const [key, value] of storeEntries) {
    cache[key] = value.responseText
  }
}

export function getFile(path: string) {
  if (path in cache) {
    // console.debug('Got item from cache ', path)
    return cache[path]
  }
  // console.debug('Item not in cache ', path)
  const req = new XMLHttpRequest()
  try {
    const url = 'http://localhost:3001' + (path.startsWith('file://') ? path.slice('file://'.length) : path)
    req.open('GET', url, false)
    req.send()
    if (req.status !== 200) {
      cache[path] = undefined
      set(path, {}, store)
      return
    }
    const responseText = req.responseText
    cache[path] = responseText
    set(path, { responseText }, store)
    return responseText
  } catch (e) {
    set(path, {}, store)
    return
  }
}
