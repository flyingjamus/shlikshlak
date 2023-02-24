import { ZodiosApp } from '@zodios/express'
import { filesApi } from '../common/api'
import { ZodObject } from 'zod'
import { promises } from 'fs'
import path from 'path'
import launchEditor from 'react-dev-utils/launchEditor'
import globby from 'globby'
import { getEntryData } from '../stories/ParseStories/parse/get-entry-data'
import { detectDuplicateStoryNames } from '../stories/ParseStories/utils'
import getGeneratedList from '../stories/ParseStories/generate/get-generated-list'
import { doChanges, getPanelsAtLocation, setAttributeAtPosition } from './ts'

export function bindMethods(app: ZodiosApp<typeof filesApi, ZodObject<any>>) {
  const { readFile, writeFile, stat, readdir } = promises
  const ROOT_PATH = path.join(__dirname, '..', '..')

  function getFilePath(filePath: string) {
    // TODO!!!!!!!!!!! GUARD!!!!
    // return path.join(__dirname, '..', '..', '../nimbleway', filePath?.toString()) // TODO!!!!!!!!!!! GUARD!!!!

    const normalized = path.normalize(filePath)
    if (normalized.startsWith('..')) throw new Error('Invalid path')

    return path.join(ROOT_PATH, normalized) // TODO!!!!!!!!!!! GUARD!!!!
    // TODO!!!!!!!!!!! GUARD!!!!
  }

  app.post('/launch_editor', async (req, res) => {
    const { fileName, lineNumber, colNumber } = req.body
    const filePath = getFilePath(fileName)
    console.log('Launching editor', req.body)
    setTimeout(() => {
      launchEditor(filePath, lineNumber, colNumber)
    })
    res.json({})
  })

  app.get('/init', async (req, res) => {
    res.json({ rootPath: ROOT_PATH })
  })

  app.get('/stories', async (req, res) => {
    const entries = await globby(['./**/*.stories.ts{,x}'], { gitignore: true })
    const entryData = await getEntryData(entries)
    detectDuplicateStoryNames(entryData)
    const generatedList = getGeneratedList(entryData, 'configFolder', false)
    res.json({ stories: entryData })
  })

  app.post('/lang/getPanelsAtPosition', async ({ body }, res) => {
    const { fileName, lineNumber, colNumber } = body
    try {
      res.json(await getPanelsAtLocation(fileName, lineNumber - 1, colNumber!))
    } catch (e) {
      console.error(e)
      res.status(400).json()
    }
  })

  app.post('/lang/setAttributeAtPosition', async ({ body }, res) => {
    try {
      const undoChanges = await setAttributeAtPosition(body)
      res.json({ undoChanges: undoChanges ? undoChanges : undefined, error: !!undoChanges })
    } catch (e) {
      console.error(e)
      res.status(400).json()
    }
  })

  app.post('/do_change', async ({ body }, res) => {
    try {
      const changes = doChanges(body.changes)
      res.json({
        error: !!changes,
        undoChanges: changes ? changes : undefined,
      })
    } catch (e) {
      console.error(e)
      res.status(400).json()
    }
  })
}
