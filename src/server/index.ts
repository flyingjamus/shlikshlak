import express from 'express'
import cors from 'cors'
import serveIndex from 'serve-index'
import { promises } from 'fs'
import path from 'path'

const { readFile, writeFile } = promises
const app = express()
const PORT = 3001
app.use(cors())
app.use(express.json())

// app.get('/', (req, res) => {
//   res.send('Hello World!')
// })

app.get('*', async (req, res) => {
  // TOOD!!!!!!!!!! validate
  const filePath = path.join(__dirname, '..', '..', req.path)
  try {
    const contents = await readFile(filePath, 'utf-8')
    res.send(contents)
  } catch (e) {
    res.status(204).send()
  }
})

app.post('*', async (req, res) => {
  // TOOD!!!!!!!!!! validate
  const filePath = path.join(__dirname, '..', '..', req.body.path)
  console.log('Writing', filePath)
  try {
    await writeFile(filePath, req.body.body)
    res.send('')
  } catch (e) {
    res.status(204).send()
  }
})

app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`))
