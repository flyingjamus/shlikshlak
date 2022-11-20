import * as rollup from 'rollup'
import dts from 'rollup-plugin-dts'
import { generateDtsBundle } from 'dts-bundle-generator'
export const bundleDts = async (filePath: string) => {
  const bundle = generateDtsBundle([{ filePath, libraries: { inlinedLibraries: ['@mui/material'] } }], {})
  debugger
  return bundle[0]
}
