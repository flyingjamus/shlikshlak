import fs from 'fs'
import path from 'path'
import debugFactory from 'debug'
import { traverse } from '../babel.js'
import { getFileId } from '../naming-utils.js'
import getAst from '../get-ast.js'
import getDefaultExport from './get-default-export.js'
import getStorynameAndMeta from './get-storyname-and-meta.js'
import getNamedExports from './get-named-exports.js'
import { IMPORT_ROOT } from '../utils.js'
import { EntryData, ParsedStoriesResult } from '../types'

const debug = debugFactory('ladle:vite')

export const getEntryData = async (entries: string[]): Promise<EntryData> => {
  const entryData: EntryData = {}
  for (const entry of entries) {
    debug(`Parsing ${entry}`)
    entryData[entry] = await getSingleEntry(entry)
  }
  return entryData
}

export const convertSingleEntry = async (entry: string, code: string) => {
  const result: ParsedStoriesResult = {
    entry,
    stories: [],
    exportDefaultProps: { title: undefined, meta: undefined },
    namedExportToMeta: {},
    namedExportToStoryName: {},
    storyParams: {},
    storySource: code.replace(/\r/g, ''),
    fileId: getFileId(entry),
  }
  const ast = getAst(code, entry)
  traverse(ast, {
    Program: getStorynameAndMeta.bind(this, result),
  })
  traverse(ast, {
    ExportDefaultDeclaration: getDefaultExport.bind(this, result),
  })
  traverse(ast, {
    ExportNamedDeclaration: getNamedExports.bind(this, result),
  })
  debug(`Parsed data for ${entry}:`)
  debug(result)
  return result
}

export const getSingleEntry = async (entry: string) => {
  // fs.promises.readFile is much slower, and we don't mind hogging
  // the whole CPU core since this is blocking everything else
  const code = fs.readFileSync(entry, 'utf8')
  return convertSingleEntry(entry, code)
}
