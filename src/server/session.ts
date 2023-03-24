import { initializeNodeSystem } from './ts/nodeServer'
import { LanguageServiceMode } from 'typescript'
import { Session } from './ts/session'

export const startIoSession = () => {
  const { startSession, logger: ioLogger, cancellationToken } = initializeNodeSystem()
  const ioSession: Session<string> = startSession(
    {
      globalPlugins: undefined,
      pluginProbeLocations: undefined,
      allowLocalPluginLoads: undefined,
      useSingleInferredProject: false,
      useInferredProjectPerProjectRoot: false,
      suppressDiagnosticEvents: undefined,
      noGetErrOnBackgroundUpdate: undefined,
      // syntaxOnly: false,
      serverMode: LanguageServiceMode.Semantic,
    },
    ioLogger,
    cancellationToken
  )
  return ioSession
}
