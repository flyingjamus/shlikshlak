import { createStore, entries, set } from 'idb-keyval'
import { ApiFile, filesApi } from '../common/api'
import { Aliases, ZodiosAliases } from '@zodios/core/lib/zodios.types'
import { syncXHR } from './xhr'

const store = createStore('db2', 'file-cache-1')
export type AppFile = {
  version: number
} & ApiFile

const cache: Map<string, AppFile | undefined> = new Map()

export async function fillCacheFromStore() {
  // await clear(store)
  const storeEntries = await entries<string, AppFile>(store)
  console.info('Filling all', Array.from(storeEntries.keys()).length)
  for (const [key, value] of storeEntries) {
    cache.set(key, value)
  }
}

export function getFileVersion(path: string) {
  return cache.get(path)?.version
}

export function fileExists(path: string) {
  if (cache.has(path)) {
    return !!cache.get(path)
  }
  return !!getFile(path)?.exists
}

function pathToUrl(path: string) {
  path = path.startsWith('file:/') ? path.slice('file:/'.length) : path
  path = path.replace(/^\/+/, '')
  return path
}

type Api = typeof filesApi

type ReplaceReturnType<T extends (...a: any) => any, TNewReturn> = (...a: Parameters<T>) => TNewReturn

type A = ZodiosAliases<Api>
declare type ApiClientType = {
  [Alias in Aliases<Api>]: ReplaceReturnType<A[Alias], Awaited<ReturnType<A[Alias]>>>
}

const syncClient: ApiClientType = {
  getFile: (body) => {
    const url = BASE + '/get_file'
    const res: ReturnType<ApiClientType['getFile']> = syncXHR({ url, json: body })
    return res
  },
  writeFile: (body, configOptions) => {
    return {}
  },
}

export function getFile(unfixedPath: string): AppFile {
  const path = pathToUrl(unfixedPath)
  // console.debug('FILEGETTER: Getting file', path, unfixedPath)
  const cacheFile = cache.get(path)
  if (cacheFile) {
    // console.debug('FILEGETTER: Got item from cache ', path, cacheFile.exists)
    return cacheFile
  }
  const res = syncClient.getFile({ path: path })
  const file = {
    version: 0,
    ...res,
  }
  cache.set(path, file)
  set(path, res, store)
  return file
}

export async function directoryExists(path: string) {
  const { exists } = getFile(path)
  return exists
}

const BASE = 'http://localhost:3001'

export function getFileText(path: string) {
  const file = getFile(path)
  return (file.exists && file.contents) || undefined
}
