import { toSocket, WebSocketMessageReader, WebSocketMessageWriter } from 'vscode-ws-jsonrpc'
import normalizeUrl from 'normalize-url'
import { LanguageClient } from 'vscode-languageclient/browser'

import {
  CloseAction,
  ErrorAction,
  MonacoServices,
  MessageTransports,
  BaseLanguageClient,
} from 'monaco-languageclient'
import { MonacoLanguageClient } from './monaco-language-client'

// MonacoServices.install();

const url = createUrl('localhost', 3001, '/sampleServer')
const webSocket = new WebSocket(url)

webSocket.onopen = () => {
  const socket = toSocket(webSocket)
  const reader = new WebSocketMessageReader(socket)
  const writer = new WebSocketMessageWriter(socket)
  // new LanguageClient('first', 'First', {})
  const languageClient = createLanguageClient({
    reader,
    writer,
  })
  languageClient.start()
  reader.onClose(() => languageClient.stop())
}

function createLanguageClient(transports: MessageTransports): MonacoLanguageClient {
  return new MonacoLanguageClient({
    name: 'Sample Language Client',
    clientOptions: {
      // use a language id as a document selector
      documentSelector: ['json'],
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

function createUrl(hostname: string, port: number, path: string): string {
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
  return normalizeUrl(`${protocol}://${hostname}:${port}${path}`)
}

export const LSP = () => {
  return null
}
