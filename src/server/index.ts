import cors from 'cors'
import { promises } from 'fs'
import path from 'path'
import { zodiosApp } from '@zodios/express'
import { filesApi } from '../common/api'

const { readFile, writeFile, stat } = promises
const app = zodiosApp(filesApi)
app.use(cors())

function getFilePath(filePath: string | number) {
  return path.join(__dirname, '..', '..', filePath?.toString()) // TODO guard
}

app.post('/get_file', async (req, res) => {
  console.log('Getting', req.body.path)
  const filePath = getFilePath(req.body.path)
  try {
    const stats = await stat(filePath)
    if (stats.isFile()) {
      const contents = await readFile(filePath, 'utf-8')
      res.json({ exists: true, type: 'FILE', contents })
    } else if (stats.isDirectory()) {
      res.json({ exists: true, type: 'DIR' })
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

const PORT = 3001

app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`))
