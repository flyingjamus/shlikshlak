import * as dotenv from 'dotenv'
const env = dotenv.config({ path: resolve('./.env.local') })
import cors from 'cors'
import { zodiosApp } from '@zodios/express'
import { filesApi } from '../common/api'
import { Server as SocketIOServer } from 'socket.io'
import { bindMethods } from './endpoints'
import { AppEmitter } from './AppEmitter'
import { resolve } from 'path'
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
AppEmitter.on('diagnostics', (fileName, errors) => {
  console.log('emitting', fileName, errors)
  io.emit('diagnostics', fileName, errors)
})
