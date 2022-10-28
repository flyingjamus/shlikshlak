import { createStore, get, set, entries, keys, clear } from 'idb-keyval'

const store = createStore('db2', 'file-cache-1')
// clear(store)
const cache: Record<
  string,
  | {
      version: number
      content: string | undefined
    }
  | undefined
> = {}

export async function fillCacheFromStore() {
  const storeEntries = await entries<string, { responseText?: string }>(store)
  for (const [key, value] of storeEntries) {
    cache[key] = {
      version: 0,
      content: value.responseText,
    }
  }
}

export function getFileVersion(path: string) {
  return cache[path]?.version
}

export function fileExists(path: string) {
  if (path in cache) {
    return !!cache[path]?.content
  }
  return !!getFileText(path)
}

export function getFileText(path: string) {
  if (path in cache) {
    // console.debug('Got item from cache ', path)
    return cache[path]?.content
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
    cache[path] = {
      version: 0,
      content: responseText,
    }

    set(path, { responseText }, store)
    return responseText
  } catch (e) {
    set(path, {}, store)
    return
  }
}
