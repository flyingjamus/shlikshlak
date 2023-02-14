import { __DEBUG__ } from '../../react-devtools-shared/src/constants'
import type { Thenable, Wakeable } from '../../react-devtools-shared/shared/ReactTypes'
const TIMEOUT = 30000
const Pending = 0
const Resolved = 1
const Rejected = 2
type PendingRecord = {
  status: 0
  value: Wakeable
}
type ResolvedRecord<T> = {
  status: 1
  value: T
}
type RejectedRecord = {
  status: 2
  value: null
}
type Record<T> = PendingRecord | ResolvedRecord<T> | RejectedRecord
type Module = any
type ModuleLoaderFunction = () => Thenable<Module>
// This is intentionally a module-level Map, rather than a React-managed one.
// Otherwise, refreshing the inspected element cache would also clear this cache.
// Modules are static anyway.
const moduleLoaderFunctionToModuleMap: Map<ModuleLoaderFunction, Module> = new Map()

function readRecord<T>(record: Record<T>): ResolvedRecord<T> | RejectedRecord {
  if (record.status === Resolved) {
    // This is just a type refinement.
    return record
  } else if (record.status === Rejected) {
    // This is just a type refinement.
    return record
  } else {
    throw record.value
  }
}

// TODO Flow type
export function loadModule(moduleLoaderFunction: ModuleLoaderFunction): Module {
  let record = moduleLoaderFunctionToModuleMap.get(moduleLoaderFunction)

  if (__DEBUG__) {
    console.log(`[dynamicImportCache] loadModule("${moduleLoaderFunction.name}")`)
  }

  if (!record) {
    const callbacks = new Set()
    const wakeable: Wakeable = {
      then(callback) {
        callbacks.add(callback)
      },

      // Optional property used by Timeline:
      displayName: `Loading module "${moduleLoaderFunction.name}"`,
    }

    const wake = () => {
      if (timeoutID) {
        clearTimeout(timeoutID)
        timeoutID = null
      }

      // This assumes they won't throw.
      callbacks.forEach((callback) => callback())
      callbacks.clear()
    }

    const newRecord: Record<Module> = (record = {
      status: Pending,
      value: wakeable,
    })
    let didTimeout = false
    moduleLoaderFunction().then(
      (module) => {
        if (__DEBUG__) {
          console.log(`[dynamicImportCache] loadModule("${moduleLoaderFunction.name}") then()`)
        }

        if (didTimeout) {
          return
        }

        const resolvedRecord = newRecord as any as ResolvedRecord<Module>
        resolvedRecord.status = Resolved
        resolvedRecord.value = module
        wake()
      },
      (error) => {
        if (__DEBUG__) {
          console.log(`[dynamicImportCache] loadModule("${moduleLoaderFunction.name}") catch()`)
        }

        if (didTimeout) {
          return
        }

        console.log(error)
        const thrownRecord = newRecord as any as RejectedRecord
        thrownRecord.status = Rejected
        thrownRecord.value = null
        wake()
      }
    )
    // Eventually timeout and stop trying to load the module.
    let timeoutID = setTimeout(function onTimeout() {
      if (__DEBUG__) {
        console.log(`[dynamicImportCache] loadModule("${moduleLoaderFunction.name}") onTimeout()`)
      }

      timeoutID = null
      didTimeout = true
      const timedoutRecord = newRecord as any as RejectedRecord
      timedoutRecord.status = Rejected
      timedoutRecord.value = null
      wake()
    }, TIMEOUT)
    moduleLoaderFunctionToModuleMap.set(moduleLoaderFunction, record)
  }

  const response = readRecord(record).value
  return response
}
