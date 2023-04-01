import { pino } from 'pino'
import pinoPretty from 'pino-pretty'

const baseLogger = pino(
  { level: 'debug' },
  pinoPretty({
    colorize: true,
    hideObject: true,
    // customPrettifiers: {
    //   file: (inputData) => {
    //     console.log(inputData)
    //     return bgBlack(inputData)
    //   },
    // },

    messageFormat: (log, messageKey) => {
      const message = log[messageKey] as string
      if (log.file) return `[${log.file}] ${message}`
      return message
    }
  })
)
export const createLogger = (name: string) => baseLogger.child({ file: name }, { level: 'error' })
