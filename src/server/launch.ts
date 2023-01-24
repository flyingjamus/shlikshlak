import { resolve } from 'path'
import { IWebSocket, WebSocketMessageReader, WebSocketMessageWriter } from 'vscode-ws-jsonrpc'
import { createConnection, createServerProcess, forward } from 'vscode-ws-jsonrpc/server'
import { Message, InitializeRequest, InitializeParams } from 'vscode-languageserver'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

function getLocalDirectory() {
  const __filename = fileURLToPath(import.meta.url)
  return dirname(__filename)
}
export function launch(socket: IWebSocket) {
  const reader = new WebSocketMessageReader(socket)
  const writer = new WebSocketMessageWriter(socket)
  // start the language server as an external process
  const extJsonServerPath = resolve(getLocalDirectory(), './start.ts')
  const socketConnection = createConnection(reader, writer, () => socket.dispose())
  const serverConnection = createServerProcess('JSON', 'yarn', ['vite-node', extJsonServerPath, '--', '--', '--stdio'])
  if (serverConnection) {
    forward(socketConnection, serverConnection, (message) => {
      if (Message.isRequest(message)) {
        if (message.method === InitializeRequest.type.method) {
          const initializeParams = message.params as InitializeParams
          initializeParams.processId = process.pid
        }
      }
      return message
    })
  }
}
