import TsWorker from './tsWorker?worker'
import { initTsWorker } from '../workers'
import { useEffect } from 'react'
import { TypeScriptWorker } from './TypeScriptWorker'
import { COMPILER_OPTIONS } from '../Components/Editor/COMPILER_OPTIONS'
import { fillCacheFromStore } from './fileGetter'

const tsWorker = new TsWorker()

export const GetAllComponents = () => {
  useEffect(() => {
    ;(async () => {
      await fillCacheFromStore()
      const t = new TypeScriptWorker(
        {
          getMirrorModels() {
            return []
          },
        },
        { compilerOptions: COMPILER_OPTIONS, extraLibs: {} }
      )
      // t.
    })()
  }, [])
  return null
}
