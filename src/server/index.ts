import * as dotenv from 'dotenv'
import cors from 'cors'
import { zodiosApp } from '@zodios/express'
import { filesApi } from '../common/api'
import { bindMethods } from './endpoints'
import { resolve } from 'path'
import expressWebsockets from 'express-ws'
import fs from 'fs/promises'
import chokidar from 'chokidar'
import writeFileAtomic from 'write-file-atomic'

const PORT = 3001

const watcher = chokidar.watch([], {
  persistent: true,
})

const env = dotenv.config({ path: resolve('./.env.local') })

const { app } = expressWebsockets(zodiosApp(filesApi) as any)

app.use(cors())

const eventHandlers = {
  FILE_UPDATE: async (payload: { filename: string; text: string }) => {
    // TODO!!!!!!!!!!!!!!!!!!!!11 VERIFY !!!!!!!!!!!!!!!!!!!!!!!!!!!!1
    await writeFileAtomic(resolve(payload.filename), payload.text)
  },
}

bindMethods(app as any)
app.ws('/docs/*', async (ws, request) => {
  const fileName = request.params[0]
  // TODO!!!!!!!!!!!!!!!!!!!!11 VERIFY !!!!!!!!!!!!!!!!!!!!!!!!!!!!1

  ws.send(
    JSON.stringify({
      type: 'FILE_CONTENTS',
      payload: await fs.readFile(resolve(fileName), 'utf-8'),
    })
  )
  ws.addEventListener('message', ({ data }) => {
    const { type, payload } = JSON.parse(data)
    console.log(1111111, type, payload)
    const handler = eventHandlers[type]
    handler(payload)
  })
})
app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`))
