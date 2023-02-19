import * as ts from 'typescript'
import {
  CharacterCodes,
  combinePaths,
  createQueue,
  Debug,
  directorySeparator,
  DirectoryWatcherCallback,
  FileWatcher,
  getDirectoryPath,
  getNodeMajorVersion,
  getRootLength,
  LanguageServiceMode,
  Logger,
  MapLike,
  noop,
  noopFileWatcher,
  normalizePath,
  normalizeSlashes,
  resolveJSModule,
  resolvePath,
  stripQuotes,
  sys,
  toFileNameLowerCase,
  tracing,
  WatchOptions,
  server,
} from 'typescript'
import { getLogLevel, StartSessionOptions } from './ts/common'
import { nowString } from './ts/jsTyping/shared'
import { perfLogger } from './ts/perfLogger'
import { nullCancellationToken, ServerCancellationToken, Session } from './ts/session'
import { ModuleImportResult, ServerHost } from './ts/types'
import { LogLevel, Msg } from './ts/utilitiesPublic'
import { stringifyIndented } from './ts/utilities'
import { nullTypingsInstaller } from './ts/typingsCache'
import { resolve } from 'path'

interface LogOptions {
  file?: string
  detailLevel?: LogLevel
  traceToConsole?: boolean
  logToFile?: boolean
}

interface NodeChildProcess {
  send(message: any, sendHandle?: any): void
  on(message: 'message' | 'exit', f: (m: any) => void): void
  kill(): void
  pid: number
}

interface ReadLineOptions {
  input: NodeJS.ReadableStream
  output?: NodeJS.WritableStream
  terminal?: boolean
  historySize?: number
}

interface NodeSocket {
  write(data: string, encoding: string): boolean
}

function parseLoggingEnvironmentString(logEnvStr: string | undefined): LogOptions {
  if (!logEnvStr) {
    return {}
  }
  const logEnv: LogOptions = { logToFile: true }
  const args = logEnvStr.split(' ')
  const len = args.length - 1
  for (let i = 0; i < len; i += 2) {
    const option = args[i]
    const { value, extraPartCounter } = getEntireValue(i + 1)
    i += extraPartCounter
    if (option && value) {
      switch (option) {
        case '-file':
          logEnv.file = value
          break
        case '-level':
          {
            const level = getLogLevel(value)
            logEnv.detailLevel = level !== undefined ? level : LogLevel.normal
          }
          break
        case '-traceToConsole':
          logEnv.traceToConsole = value.toLowerCase() === 'true'
          break
        case '-logToFile':
          logEnv.logToFile = value.toLowerCase() === 'true'
          break
      }
    }
  }
  return logEnv

  function getEntireValue(initialIndex: number) {
    let pathStart = args[initialIndex]
    let extraPartCounter = 0
    if (
      pathStart.charCodeAt(0) === CharacterCodes.doubleQuote &&
      pathStart.charCodeAt(pathStart.length - 1) !== CharacterCodes.doubleQuote
    ) {
      for (let i = initialIndex + 1; i < args.length; i++) {
        pathStart += ' '
        pathStart += args[i]
        extraPartCounter++
        if (pathStart.charCodeAt(pathStart.length - 1) === CharacterCodes.doubleQuote) break
      }
    }
    return { value: stripQuotes(pathStart), extraPartCounter }
  }
}

/** @internal */
export function initializeNodeSystem(): {
  args: readonly string[]
  logger: Logger
  cancellationToken: ServerCancellationToken
  serverMode: LanguageServiceMode | undefined
  unknownServerMode?: string
  startSession: (
    option: StartSessionOptions,
    logger: Logger,
    cancellationToken: ServerCancellationToken
  ) => Session
} {
  const sys = Debug.checkDefined(ts.sys) as ServerHost
  const childProcess: {
    execFileSync(
      file: string,
      args: string[],
      options: { stdio: 'ignore'; env: MapLike<string> }
    ): string | Buffer
  } = require('child_process')

  interface Stats {
    isFile(): boolean
    isDirectory(): boolean
    isBlockDevice(): boolean
    isCharacterDevice(): boolean
    isSymbolicLink(): boolean
    isFIFO(): boolean
    isSocket(): boolean
    dev: number
    ino: number
    mode: number
    nlink: number
    uid: number
    gid: number
    rdev: number
    size: number
    blksize: number
    blocks: number
    atime: Date
    mtime: Date
    ctime: Date
    birthtime: Date
  }

  const fs: {
    openSync(path: string, options: string): number
    close(fd: number, callback: (err: NodeJS.ErrnoException) => void): void
    writeSync(fd: number, buffer: Buffer, offset: number, length: number, position?: number): number
    statSync(path: string): Stats
    stat(path: string, callback?: (err: NodeJS.ErrnoException, stats: Stats) => any): void
  } = require('fs')

  class Logger implements Logger {
    private seq = 0
    private inGroup = false
    private firstInGroup = true
    private fd = -1
    constructor(
      private readonly logFilename: string,
      private readonly traceToConsole: boolean,
      private readonly level: LogLevel
    ) {
      if (this.logFilename) {
        try {
          this.fd = fs.openSync(this.logFilename, 'w')
        } catch (_) {
          // swallow the error and keep logging disabled if file cannot be opened
        }
      }
    }
    static padStringRight(str: string, padding: string) {
      return (str + padding).slice(0, padding.length)
    }
    close() {
      if (this.fd >= 0) {
        fs.close(this.fd, noop)
      }
    }
    getLogFileName(): string | undefined {
      return this.logFilename
    }
    perftrc(s: string) {
      this.msg(s, Msg.Perf)
    }
    info(s: string) {
      this.msg(s, Msg.Info)
    }
    err(s: string) {
      this.msg(s, Msg.Err)
    }
    startGroup() {
      this.inGroup = true
      this.firstInGroup = true
    }
    endGroup() {
      this.inGroup = false
    }
    loggingEnabled() {
      return !!this.logFilename || this.traceToConsole
    }
    hasLevel(level: LogLevel) {
      return this.loggingEnabled() && this.level >= level
    }
    msg(s: string, type: Msg = Msg.Err) {
      switch (type) {
        case Msg.Info:
          perfLogger.logInfoEvent(s)
          break
        case Msg.Perf:
          perfLogger.logPerfEvent(s)
          break
        default: // Msg.Err
          perfLogger.logErrEvent(s)
          break
      }

      if (!this.canWrite()) return

      s = `[${nowString()}] ${s}\n`
      if (!this.inGroup || this.firstInGroup) {
        const prefix = Logger.padStringRight(type + ' ' + this.seq.toString(), '          ')
        s = prefix + s
      }
      this.write(s, type)
      if (!this.inGroup) {
        this.seq++
      }
    }
    protected canWrite() {
      return this.fd >= 0 || this.traceToConsole
    }
    protected write(s: string, _type: Msg) {
      if (this.fd >= 0) {
        const buf = sys.bufferFrom!(s)
        fs.writeSync(this.fd, buf as globalThis.Buffer, 0, buf.length, /*position*/ null!) // TODO: GH#18217
      }
      if (this.traceToConsole) {
        console.warn(s)
      }
    }
  }

  const libDirectory = getDirectoryPath(normalizePath(sys.getExecutingFilePath()))

  const nodeVersion = getNodeMajorVersion()
  // use watchGuard process on Windows when node version is 4 or later
  const useWatchGuard = process.platform === 'win32' && nodeVersion! >= 4
  const originalWatchDirectory: ServerHost['watchDirectory'] = sys.watchDirectory.bind(sys)
  const logger = createLogger()

  // enable deprecation logging
  Debug.loggingHost = {
    log(level, s) {
      switch (level) {
        case ts.LogLevel.Error:
        case ts.LogLevel.Warning:
          return logger.msg(s, Msg.Err)
        case ts.LogLevel.Info:
        case ts.LogLevel.Verbose:
          return logger.msg(s, Msg.Info)
      }
    },
  }

  const pending = createQueue<Buffer>()
  let canWrite = true

  if (useWatchGuard) {
    const currentDrive = extractWatchDirectoryCacheKey(
      sys.resolvePath(sys.getCurrentDirectory()),
      /*currentDriveKey*/ undefined
    )
    const statusCache = new Map<string, boolean>()
    sys.watchDirectory = (path, callback, recursive, options) => {
      const cacheKey = extractWatchDirectoryCacheKey(path, currentDrive)
      let status = cacheKey && statusCache.get(cacheKey)
      if (status === undefined) {
        if (logger.hasLevel(LogLevel.verbose)) {
          logger.info(`${cacheKey} for path ${path} not found in cache...`)
        }
        try {
          const args = [combinePaths(libDirectory, 'watchGuard.js'), path]
          if (logger.hasLevel(LogLevel.verbose)) {
            logger.info(`Starting ${process.execPath} with args:${stringifyIndented(args)}`)
          }
          childProcess.execFileSync(process.execPath, args, {
            stdio: 'ignore',
            env: { ELECTRON_RUN_AS_NODE: '1' },
          })
          status = true
          if (logger.hasLevel(LogLevel.verbose)) {
            logger.info(`WatchGuard for path ${path} returned: OK`)
          }
        } catch (e) {
          status = false
          if (logger.hasLevel(LogLevel.verbose)) {
            logger.info(`WatchGuard for path ${path} returned: ${e.message}`)
          }
        }
        if (cacheKey) {
          statusCache.set(cacheKey, status)
        }
      } else if (logger.hasLevel(LogLevel.verbose)) {
        logger.info(`watchDirectory for ${path} uses cached drive information.`)
      }
      if (status) {
        // this drive is safe to use - call real 'watchDirectory'
        return watchDirectorySwallowingException(path, callback, recursive, options)
      } else {
        // this drive is unsafe - return no-op watcher
        return noopFileWatcher
      }
    }
  } else {
    sys.watchDirectory = watchDirectorySwallowingException
  }

  // Override sys.write because fs.writeSync is not reliable on Node 4
  sys.write = (s: string) => writeMessage(sys.bufferFrom!(s, 'utf8') as globalThis.Buffer)

  /* eslint-disable no-restricted-globals */
  sys.setTimeout = setTimeout
  sys.clearTimeout = clearTimeout
  sys.setImmediate = setImmediate
  sys.clearImmediate = clearImmediate
  /* eslint-enable no-restricted-globals */

  if (typeof global !== 'undefined' && global.gc) {
    sys.gc = () => global.gc?.()
  }

  sys.require = (initialDir: string, moduleName: string): ModuleImportResult => {
    try {
      return { module: require(resolveJSModule(moduleName, initialDir, sys)), error: undefined }
    } catch (error) {
      return { module: undefined, error }
    }
  }

  let cancellationToken: ServerCancellationToken
  try {
    const factory = require('./cancellationToken')
    cancellationToken = factory(sys.args)
  } catch (e) {
    cancellationToken = nullCancellationToken
  }

  const serverMode: LanguageServiceMode | undefined = LanguageServiceMode.Semantic
  let unknownServerMode: string | undefined
  return {
    args: process.argv,
    logger,
    cancellationToken,
    serverMode,
    unknownServerMode,
    startSession: startNodeSession,
  }

  // TSS_LOG "{ level: "normal | verbose | terse", file?: string}"
  function createLogger() {
    const cmdLineLogFileName = undefined
    const cmdLineVerbosity = getLogLevel(undefined)
    const envLogOptions = parseLoggingEnvironmentString(process.env.TSS_LOG)

    const unsubstitutedLogFileName = cmdLineLogFileName
      ? stripQuotes(cmdLineLogFileName)
      : envLogOptions.logToFile
      ? envLogOptions.file || libDirectory + '/.log' + process.pid.toString()
      : undefined

    const substitutedLogFileName = unsubstitutedLogFileName
      ? unsubstitutedLogFileName.replace('PID', process.pid.toString())
      : undefined

    const logVerbosity = cmdLineVerbosity || envLogOptions.detailLevel
    return new Logger(substitutedLogFileName, true!, envLogOptions.traceToConsole!, logVerbosity!) // TODO: GH#18217
  }

  function writeMessage(buf: Buffer) {
    if (!canWrite) {
      pending.enqueue(buf)
    } else {
      canWrite = false
      process.stdout.write(buf, setCanWriteFlagAndWriteMessageIfNecessary)
    }
  }

  function setCanWriteFlagAndWriteMessageIfNecessary() {
    canWrite = true
    if (!pending.isEmpty()) {
      writeMessage(pending.dequeue())
    }
  }

  function extractWatchDirectoryCacheKey(path: string, currentDriveKey: string | undefined) {
    path = normalizeSlashes(path)
    if (isUNCPath(path)) {
      // UNC path: extract server name
      // //server/location
      //         ^ <- from 0 to this position
      const firstSlash = path.indexOf(directorySeparator, 2)
      return firstSlash !== -1 ? toFileNameLowerCase(path.substring(0, firstSlash)) : path
    }
    const rootLength = getRootLength(path)
    if (rootLength === 0) {
      // relative path - assume file is on the current drive
      return currentDriveKey
    }
    if (path.charCodeAt(1) === CharacterCodes.colon && path.charCodeAt(2) === CharacterCodes.slash) {
      // rooted path that starts with c:/... - extract drive letter
      return toFileNameLowerCase(path.charAt(0))
    }
    if (path.charCodeAt(0) === CharacterCodes.slash && path.charCodeAt(1) !== CharacterCodes.slash) {
      // rooted path that starts with slash - /somename - use key for current drive
      return currentDriveKey
    }
    // do not cache any other cases
    return undefined
  }

  function isUNCPath(s: string): boolean {
    return (
      s.length > 2 && s.charCodeAt(0) === CharacterCodes.slash && s.charCodeAt(1) === CharacterCodes.slash
    )
  }

  // This is the function that catches the exceptions when watching directory, and yet lets project service continue to function
  // Eg. on linux the number of watches are limited and one could easily exhaust watches and the exception ENOSPC is thrown when creating watcher at that point
  function watchDirectorySwallowingException(
    path: string,
    callback: DirectoryWatcherCallback,
    recursive?: boolean,
    options?: WatchOptions
  ): FileWatcher {
    try {
      return originalWatchDirectory(path, callback, recursive, options)
    } catch (e) {
      logger.info(`Exception when creating directory watcher: ${e.message}`)
      return noopFileWatcher
    }
  }
}

function startNodeSession(
  options: StartSessionOptions,
  logger: Logger,
  cancellationToken: ServerCancellationToken
) {
  class IOSession extends Session {
    constructor() {
      const host = sys as ServerHost

      super({
        host,
        cancellationToken,
        ...options,
        typingsInstaller: nullTypingsInstaller,
        byteLength: Buffer.byteLength,
        hrtime: process.hrtime,
        logger,
        canUseEvents: true,
        typesMapLocation,
      })
    }

    exit() {
      this.logger.info('Exiting...')
      this.projectService.closeLog()
      tracing?.stopTracing()
      process.exit(0)
    }
  }

  const typesMapLocation = resolvePath(
    getDirectoryPath(sys.getExecutingFilePath()),
    '../../node_modules/typescript/lib',
    'typesMap.json'
  ) // TODO!!!!!!!!!

  const ioSession = new IOSession()

  process.on('uncaughtException', (err) => {
    ioSession.logError(err, 'unknown')
  })
  return ioSession
}
