import cors from 'cors'
import { promises } from 'fs'
import path from 'path'
import { zodiosApp } from '@zodios/express'
import { filesApi } from '../common/api'
import launchEditor from 'react-dev-utils/launchEditor'
import { getEntryData } from '../stories/ParseStories/parse/get-entry-data'
import globby from 'globby'
import { detectDuplicateStoryNames } from '../stories/ParseStories/utils'
import getGeneratedList from '../stories/ParseStories/generate/get-generated-list'
import { getPanelsAtLocation, setAttributeAtPosition } from './ts'

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
    await setAttributeAtPosition(body)
    res.json({})
  } catch (e) {
    console.error(e)
    res.status(400).json()
  }
})

const PORT = 3001

const server = app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`))

// const wss = new WebSocketServer({
//   noServer: true,
//   perMessageDeflate: false,
// })
// server.on('upgrade', (request: IncomingMessage, socket: Socket, head: Buffer) => {
//   const baseURL = `http://${request.headers.host}/`
//   const pathname = request.url ? new URL(request.url, baseURL).pathname : undefined
//   if (pathname === '/sampleServer') {
//     wss.handleUpgrade(request, socket, head, (webSocket) => {
//       const socket: IWebSocket = {
//         send: (content) =>
//           webSocket.send(content, (error) => {
//             console.log(content)
//             if (error) {
//               throw error
//             }
//           }),
//         onMessage: (cb) => webSocket.on('message', cb),
//         onError: (cb) => webSocket.on('error', cb),
//         onClose: (cb) => webSocket.on('close', cb),
//         dispose: () => webSocket.close(),
//       }
//       // launch the server when the web socket is opened
//       if (webSocket.readyState === webSocket.OPEN) {
//         launch(socket)
//       } else {
//         webSocket.on('open', () => launch(socket))
//       }
//     })
//   }
// })
//
