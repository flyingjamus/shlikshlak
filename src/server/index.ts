import express from 'express'
import cors from 'cors'
import serveIndex from 'serve-index'
import { promises } from 'fs'
import path from 'path'

const { readFile } = promises
const app = express()
const PORT = 3001
app.use(cors())

// app.get('/', (req, res) => {
//   res.send('Hello World!')
// })

// app.use(serveIndex('.')) // shows you the file list
// app.use(express.static('.'))
app.use(async (req, res, done) => {
  // TOOD!!!!!!!!!! validate
  const filePath = path.join(__dirname, '..', '..', req.path)
  console.log(filePath)
  try {
    const contents = await readFile(filePath, 'utf-8')
    res.send(contents)
  } catch (e) {
    res.status(204).send()
  }
  done()
})

app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`))
