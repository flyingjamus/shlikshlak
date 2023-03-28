import * as dotenv from 'dotenv'
const env = dotenv.config({ path: resolve('./.env.local') })
import cors from 'cors'
import { zodiosApp } from '@zodios/express'
import { filesApi } from '../common/api'
import { Server as SocketIOServer } from 'socket.io'
import { bindMethods } from './endpoints'
import { AppEmitter } from './AppEmitter'
import { resolve } from 'path'
import { createConnection } from 'vscode-languageserver'
import { IWebSocket, WebSocketMessageReader, WebSocketMessageWriter } from 'vscode-ws-jsonrpc'
import { TextDocumentSyncKind } from 'vscode-languageserver-protocol'

const app = zodiosApp(filesApi)

app.use(cors())

bindMethods(app)

const PORT = 3001
const server = app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`))

const io = new SocketIOServer(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

io.on('connection', (socket) => {
  console.log('New socket connection', socket.id)
  socket.on('message', (message) => {
    if (message === 'initialize') {
      const webSocket: IWebSocket = {
        send: (content) => socket.send(content),
        onMessage: (cb) => socket.on('message', cb),
        onError: (cb) => socket.on('error', cb),
        onClose: (cb) => socket.on('close', cb),
        dispose: () => socket.disconnect(true),
      }
      const reader = new WebSocketMessageReader(webSocket)
      const writer = new WebSocketMessageWriter(webSocket)
      const connection = createConnection(reader, writer, () => socket.disconnect(true))
      connection.listen()
      console.log(222222, connection)
      connection.onInitialize(() => {
        // if (params.rootPath) {
        //   this.workspaceRoot = URI.URI.file(params.rootPath)
        // } else if (params.rootUri) {
        //   this.workspaceRoot = URI.URI.parse(params.rootUri)
        // }
        connection.console.log('The server is initialized.')
        console.log(332323, 'The server is initialized.')
        return {
          capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental,
            codeActionProvider: true,
            completionProvider: {
              resolveProvider: true,
              triggerCharacters: ['"', ':'],
            },
            hoverProvider: true,
            documentSymbolProvider: true,
            documentRangeFormattingProvider: true,
            executeCommandProvider: {
              commands: ['json.documentUpper'],
            },
            colorProvider: true,
            foldingRangeProvider: true,
          },
        }
      })
    }
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected.')
  })
})

AppEmitter.on('diagnostics', (fileName, errors) => {
  console.log('emitting', fileName, errors)
  io.emit('diagnostics', fileName, errors)
})
