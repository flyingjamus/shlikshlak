import MonacoEditor from '../Editor/MonacoEditor'
import { Box, Typography } from '@mui/material'

import { io, Socket } from 'socket.io-client'
import { IWebSocket, WebSocketMessageReader, WebSocketMessageWriter } from 'vscode-ws-jsonrpc'
import { CloseAction, ErrorAction, MessageTransports, MonacoLanguageClient } from 'monaco-languageclient'
import { WrappedMonacoEditor } from '../Editor/WrappedMonacoEditor'
import { useIframeStore } from '../store'

const socket: Socket = io('http://localhost:3001')
function toSocket(webSocket: WebSocket): IWebSocket {
  return {
    send: (content) => webSocket.send(content),
    onMessage: (cb) => {
      webSocket.onmessage = (event) => cb(event.data)
    },
    onError: (cb) => {
      webSocket.onerror = (event) => {
        if ('message' in event) {
          cb((event as any).message)
        }
      }
    },
    onClose: (cb) => {
      webSocket.onclose = (event) => cb(event.code, event.reason)
    },
    dispose: () => webSocket.close(),
  }
}
socket.on('connect', () => {
  console.log('Socket connectied')

  // Example event: send a message
  socket.emit('message', 'Hello from the client!')

  // Example event: receive a message
  socket.on('message', (data: string) => {
    console.log('Received message:', data)
  })
  const webSocket = {
    send(content: string) {
      socket.send(content)
    },
    dispose(): void {
      socket.disconnect()
    },
    onClose(cb: (code: number, reason: string) => void): void {
      // socket.on('')
    },
    onError(cb: (reason: any) => void): void {},
    onMessage(cb: (data: any) => void): void {},
  }
  const reader = new WebSocketMessageReader(webSocket)
  const writer = new WebSocketMessageWriter(webSocket)
  const languageClient = createLanguageClient({
    reader,
    writer,
  })
  languageClient.start()
  reader.onClose(() => languageClient.stop())
})

function createLanguageClient(transports: MessageTransports): MonacoLanguageClient {
  return new MonacoLanguageClient({
    name: 'Sample Language Client',
    clientOptions: {
      // use a language id as a document selector
      documentSelector: ['typescript'],
      // disable the default error handler
      errorHandler: {
        error: () => ({ action: ErrorAction.Continue }),
        closed: () => ({ action: CloseAction.DoNotRestart }),
      },
    },
    // create a language client connection from the JSON RPC connection on demand
    connectionProvider: {
      get: () => {
        return Promise.resolve(transports)
      },
    },
  })
}

export const CodeTab = () => {
  return (
    <Box sx={{ height: '100%' }}>
      <WrappedMonacoEditor key={'editor'} />
    </Box>
  )
}
