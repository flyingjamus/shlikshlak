import { Logger, LogLevel, ServerCancellationToken, Session, SessionOptions } from './_namespaces/ts.server'
import { LanguageServiceMode } from './_namespaces/ts'

/** @internal */
export function getLogLevel(level: string | undefined) {
  if (level) {
    const l = level.toLowerCase()
    for (const name in LogLevel) {
      if (isNaN(+name) && l === name.toLowerCase()) {
        return LogLevel[name] as any as LogLevel
      }
    }
  }
  return undefined
}

/** @internal */
export interface StartSessionOptions {
  globalPlugins: SessionOptions['globalPlugins']
  pluginProbeLocations: SessionOptions['pluginProbeLocations']
  allowLocalPluginLoads: SessionOptions['allowLocalPluginLoads']
  useSingleInferredProject: SessionOptions['useSingleInferredProject']
  useInferredProjectPerProjectRoot: SessionOptions['useInferredProjectPerProjectRoot']
  suppressDiagnosticEvents: SessionOptions['suppressDiagnosticEvents']
  noGetErrOnBackgroundUpdate: SessionOptions['noGetErrOnBackgroundUpdate']
  syntaxOnly: SessionOptions['syntaxOnly']
  serverMode: SessionOptions['serverMode']
}
