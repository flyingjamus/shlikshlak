import * as Y from 'yjs'
import * as dotenv from 'dotenv'
import cors from 'cors'
import { zodiosApp } from '@zodios/express'
import { filesApi } from '../common/api'
import { bindMethods } from './endpoints'
import { resolve } from 'path'
import expressWebsockets from 'express-ws'
import { Hocuspocus } from '@hocuspocus/server'
import fs from 'fs/promises'

import { Logger } from '@hocuspocus/extension-logger'

const PORT = 3001

const server = new Hocuspocus({
  extensions: [
    new Logger({
      onConnect: true,
      onStoreDocument: true,
      onDestroy: true,
      onDisconnect: true,
      onRequest: true,
    }),
  ],
  port: PORT,
  async onDestroy(data): Promise<any> {
    console.log(1233312321312, data)
  },
  async onConnect(data) {},
  async onLoadDocument(data) {
    // TODO !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!11 check path
    const fileContent = await fs.readFile(data.documentName, 'utf-8')
    const text = data.document.getText()

    if (text.toString() !== fileContent) {
      text.delete(0, text.length)
      text.insert(0, fileContent)
    }

    return data.document
  },
  async onStoreDocument(data) {
    // TODO !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!11 check path
    await fs.writeFile(data.documentName, data.document.getText().toString())
    return data.document
  },
  // on
})

const env = dotenv.config({ path: resolve('./.env.local') })

const { app } = expressWebsockets(zodiosApp(filesApi) as any)

app.use(cors())

bindMethods(app as any)
app.ws('*', (websocket, request) => {
  server.handleConnection(websocket, request)
})
app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`))
