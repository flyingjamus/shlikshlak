import { connectToParent } from 'penpal'
import methods from '../Components/Preview/xebug/lib/methods'
import { ProtocolDispatchers } from '../types/protocol-proxy-api'
import { parentMethods } from '../Components/Preview/Preview'

const connection = connectToParent<typeof parentMethods>({
  methods,
  parentOrigin: '*',
})

export const parentConnection = await connection.promise
