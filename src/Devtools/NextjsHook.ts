import type { Compiler, WebpackPluginInstance } from 'webpack'
import ConcatSource from 'webpack-sources/lib/ConcatSource'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs/promises')
const { resolve } = require('path')

export class PrependCodeWebpackPlugin implements WebpackPluginInstance {
  constructor(private codeToPrepend: string) {}

  apply(compiler: Compiler): void {
    compiler.hooks.emit.tapAsync('PrependCodeWebpackPlugin', (compilation, callback) => {
      const targetChunkName = 'main'
      const assetName = compilation.namedChunks.get(targetChunkName)?.files.values().next().value

      if (assetName && compilation.assets[assetName]) {
        const originalSource = compilation.assets[assetName]
        const concatSource = new ConcatSource(this.codeToPrepend, '\n', originalSource)
        compilation.assets[assetName] = concatSource
      }

      callback()
    })
  }
}

export const withShlikshlak = async (nextConfig: {
  webpack?: (config: any, context: { isServer: string }) => any
}) => {
  const code = await fs.readFile(resolve(__dirname, 'hook.cjs'), 'utf-8')
  return Object.assign({}, nextConfig, {
    webpack(config: any, context: { isServer: string }) {
      if (!context.isServer) {
        config.plugins.push(
          new PrependCodeWebpackPlugin(code)
        )
      }

      if (typeof nextConfig.webpack === 'function') {
        return nextConfig.webpack(config, context)
      }

      return config
    },
  })
}
