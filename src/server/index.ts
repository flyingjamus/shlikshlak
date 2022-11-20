import cors from 'cors'
import { promises } from 'fs'
import path from 'path'
import { zodiosApp } from '@zodios/express'
import { filesApi } from '../common/api'
import { bundleDts } from './bundleDts'
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

function getFilePath(filePath: string | number) {
  // TODO!!!!!!!!!!! GUARD!!!!
  return path.join(__dirname, '..', '..', '../nimbleway', filePath?.toString()) // TODO!!!!!!!!!!! GUARD!!!!
  // TODO!!!!!!!!!!! GUARD!!!!
}

app.post('/get_file', async (req, res) => {
  console.log('Getting', req.body.path)
  const filePath = getFilePath(req.body.path)
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
    res.json({})
    // res.status(204).send()
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

const PORT = 3001

app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`))
