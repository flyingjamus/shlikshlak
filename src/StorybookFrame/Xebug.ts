import { connectToParent } from 'penpal'
import methods from '../Components/Preview/xebug/lib/methods'
import { ProtocolDispatchers } from '../types/protocol-proxy-api'

const connection = connectToParent<ProtocolDispatchers>({
  methods,
  parentOrigin: '*',
})

export const parentConnection = await connection.promise
