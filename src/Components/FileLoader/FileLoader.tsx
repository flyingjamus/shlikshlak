import React from 'react'
import { get as getItem, set as setItem } from 'idb-keyval'
import { Box, Button } from '@mui/material'
import { AppFile, useFileStore } from '../store'

async function verifyPermission(fileHandle: FileSystemHandle, readWrite?: boolean) {
  const options: FileSystemHandlePermissionDescriptor = readWrite ? { mode: 'readwrite' } : {}
  if ((await fileHandle.queryPermission(options)) === 'granted') {
    return true
  }
  return (await fileHandle.requestPermission(options)) === 'granted'
}

const onClick = async () => {
  let handle = await getItem('dirHandle')
  if (handle && (await verifyPermission(handle, false))) {
    await readHandle(handle)
  } else {
    handle = await window.showDirectoryPicker()
    await setItem('dirHandle', handle)
    await readHandle(handle)
  }
}

const readHandle = async (dirHandle: FileSystemDirectoryHandle) => {
  console.time('Read')
  const res = await recurse({ allFiles: {}, files: {} }, '', dirHandle)
  console.timeEnd('Read')
  useFileStore.setState({
    files: res.files,
    allFiles: res.allFiles,
    readFile: (fileName: string) => readFile(dirHandle, fileName),
  })
}

const readWithoutCache = async (rootDir: FileSystemDirectoryHandle, filename: string) => {
  const split = filename.split('/')
  const dirParts = split.slice(0, split.length - 2)
  const filePart = split.slice(split.length - 1)[0]
  let handle = rootDir
  for (const dirName of dirParts) {
    handle = await handle.getDirectoryHandle(dirName)
  }
  const fileHandle = await handle.getFileHandle(filePart)
  const file = await fileHandle?.getFile()
  return file.text()
}

const handleCache: Record<string, FileSystemDirectoryHandle> = {}
const readFile = async (rootDir: FileSystemDirectoryHandle, filename: string) => {
  console.log('READDING', filename)
  const dirParts = filename.split('/')
  for (let i = 0; i < dirParts.length; i++) {
    const subPath = dirParts.slice(0, dirParts.length - i - 1).join('/')
    const cacheEntry = handleCache[subPath]
    if (cacheEntry) {
      return readWithoutCache(cacheEntry, dirParts.slice(i).join('/'))
    }
  }
}

type RecurseParams = { files: Record<string, AppFile>; allFiles: Record<string, boolean> }
const recurse = async (
  result: RecurseParams,
  path: string,
  dirHandle: FileSystemDirectoryHandle
): Promise<RecurseParams> => {
  for await (const childHandle of dirHandle.values()) {
    const { name, kind } = childHandle
    const childPath = path + '/' + name
    if (['node_modules', '.env', 'build', '.next', 'dist', '.git'].some((v) => childPath.includes(v))) {
      continue
    }
    if (kind === 'file') {
      if (['ts', 'tsx', 'js', 'jsx', 'json'].includes(childPath.match('[^.]*$')?.[0] || '')) {
        result.allFiles[childPath] = true
      }
      if (!['node_modules', '.env', 'build', '.next', 'dist', '.git'].some((v) => childPath.includes(v))) {
        result.files[childPath] = { path: childPath, code: await (await childHandle.getFile()).text() }
      }
    } else {
      await recurse(result, childPath, childHandle)
    }
  }
  return result
}

export function FileLoader() {
  return (
    <Box>
      <Button size={'large'} onClick={onClick}>
        OPEN
      </Button>
    </Box>
  )
}
