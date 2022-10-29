import { createStore, entries, set, clear } from 'idb-keyval'
import { apiClient } from '../client/apiClient'
import { ApiFile, filesApi } from '../common/api'
import { Aliases, ZodiosAliases } from '@zodios/core/lib/zodios.types'
import { syncXHR } from './xhr'
import { libFileMap } from '../lib/lib'
import { noop } from 'lodash-es'

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
type A = ZodiosAliases<Api>

type ReplaceReturnType<T extends (...a: any) => any, TNewReturn> = (...a: Parameters<T>) => TNewReturn

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
  console.debug('Getting file', path, unfixedPath)
  const cacheFile = cache.get(path)
  if (cacheFile) {
    console.debug('Got item from cache ', path)
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
