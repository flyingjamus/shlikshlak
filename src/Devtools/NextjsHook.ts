/* eslint-disable @typescript-eslint/no-var-requires */
import type { Compiler, WebpackPluginInstance, Configuration } from 'webpack'
import ConcatSource from 'webpack-sources/lib/ConcatSource'
const fs = require('fs/promises')
const { resolve } = require('path')

export class PrependCodeWebpackPlugin implements WebpackPluginInstance {
  constructor(private codeToPrepend: string, private codeToAppend: string) {}

  apply(compiler: Compiler): void {
    compiler.hooks.emit.tapAsync('PrependCodeWebpackPlugin', (compilation, callback) => {
      const targetChunkName = 'main'
      const assetName = compilation.namedChunks.get(targetChunkName)?.files.values().next().value

      if (assetName && compilation.assets[assetName]) {
        const originalSource = compilation.assets[assetName]
        const concatSource = new ConcatSource(this.codeToPrepend, '\n', originalSource as any, this.codeToAppend)
        compilation.assets[assetName] = concatSource as any
      }

      callback()
    })
  }
}

export const withShlikshlak = async (nextConfig: {
  webpack?: (config: any, context: { isServer: string }) => any
}) => {
  const code = await fs.readFile(resolve(__dirname, 'hook.cjs'), 'utf-8')
  // const aftercode = await fs.readFile(resolve(__dirname, 'Devtools.cjs'), 'utf-8')
  return Object.assign({}, nextConfig, {
    webpack(config: Configuration, context: { isServer: string }) {
      const originalEntry = config.entry

      const resolvedModulePath = resolve(__dirname, 'Devtools.cjs')
      if (!context.isServer) {
        config.plugins!.push(new PrependCodeWebpackPlugin(code, ''))
        config.entry = async () => {
          const entries = await (originalEntry as any)()
          // console.log(1111111, entries)
          if (!entries['main.js'].includes(resolvedModulePath) && !Array.isArray(entries['react-refresh'])) {
            entries['main.js'].unshift(resolvedModulePath)
            // entries['react-refresh'] = resolvedModulePath
          }
          // console.log(2222222, entries)
          return entries
        }
      }

      if (typeof nextConfig.webpack === 'function') {
        return nextConfig.webpack(config, context)
      }

      return config
    },
  })
}
