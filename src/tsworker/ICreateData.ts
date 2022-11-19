import typescript from '../../../lib/TypeScript'
import { IExtraLibs } from './monaco.contribution'

export interface ICreateData {
  compilerOptions: typescript.CompilerOptions
  extraLibs: IExtraLibs
  customWorkerPath?: string
  inlayHintsOptions?: typescript.UserPreferences
}
