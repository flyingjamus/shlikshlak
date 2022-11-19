import { Uri } from 'monaco-editor-core'
import { libFileMap } from '../lib/lib'

/**
 * Loading a default lib as a source file will mess up TS completely.
 * So our strategy is to hide such a text model from TS.
 * See https://github.com/microsoft/monaco-editor/issues/2182
 */
export function fileNameIsLib(resource: Uri | string): boolean {
  if (typeof resource === 'string') {
    if (/^file:\/\/\//.test(resource)) {
      return !!libFileMap[resource.substr(8)]
    }
    return false
  }
  if (resource.path.indexOf('/lib.') === 0) {
    return !!libFileMap[resource.path.slice(1)]
  }
  return false
}
