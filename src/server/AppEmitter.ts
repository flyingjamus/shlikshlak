import EventEmitter from 'events'
import { TypedEventEmitter } from './TypedEventEmitter'
import { WriteError } from '../common/api'

export const AppEmitter = new TypedEventEmitter<{
  diagnostics: [fileName: string, errors: WriteError[]]
}>(new EventEmitter())
