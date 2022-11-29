import cors from 'cors'
import { promises } from 'fs'
import path from 'path'
import { zodiosApp } from '@zodios/express'
import { filesApi } from '../common/api'
import launchEditor from 'react-dev-utils/launchEditor'
import dotenv from 'dotenv'

dotenv.config()

export interface RuntimeDirEntry {
  name: string
  isFile: boolean
  isDirectory: boolean
  isSymlink: boolean
}
const { readFile, writeFile, stat, readdir } = promises
const app = zodiosApp(filesApi)
app.use(cors())

const ROOT_PATH = path.join(__dirname, '..', '..')

function getFilePath(filePath: string) {
  // TODO!!!!!!!!!!! GUARD!!!!
  // return path.join(__dirname, '..', '..', '../nimbleway', filePath?.toString()) // TODO!!!!!!!!!!! GUARD!!!!

  const normalized = path.normalize(filePath)
  if (normalized.startsWith('..')) throw new Error('Invalid path')

  return path.join(ROOT_PATH, normalized) // TODO!!!!!!!!!!! GUARD!!!!
  // TODO!!!!!!!!!!! GUARD!!!!
}

app.post('/get_file', async (req, res) => {
  console.log('Getting', req.body.path)
  let filePath: string
  try {
    filePath = getFilePath(req.body.path)
  } catch (e) {
    res.status(400).json()
    return
  }
  try {
    const stats = await stat(filePath)
    if (stats.isFile()) {
      // if (filePath.endsWith('d.ts')) {
      //   console.log('inside')
      //   const bundle = await bundleDts(filePath)
      //   res.json({ exists: true, type: 'FILE', contents: bundle })
      //   return
      // }
      const contents = await readFile(filePath, 'utf-8')
      res.json({ exists: true, type: 'FILE', contents })
    } else if (stats.isDirectory()) {
      const files = await readdir(filePath, { withFileTypes: true })
      res.json({
        exists: true,
        type: 'DIR',
        files: files.map(
          (v) =>
            ({
              isFile: v.isFile(),
              isDirectory: v.isDirectory(),
              name: v.name,
              isSymlink: v.isSymbolicLink(),
            } as RuntimeDirEntry)
        ),
      })
    }
  } catch (e) {
    res.json({ exists: false })
  }
})

app.post('/write_file', async (req, res) => {
  const filePath = getFilePath(req.body.path)
  console.log('Writing', filePath)
  try {
    await writeFile(filePath, req.body.contents)
    res.json({})
  } catch (e) {
    // TODO
    // res.json({})
    res.status(500).json()
  }
})

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

const PORT = 3001

app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`))
