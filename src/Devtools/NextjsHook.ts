/* eslint-disable @typescript-eslint/no-var-requires */
import type { Compiler, Configuration } from 'webpack'

const fs = require('fs/promises')
const { resolve } = require('path')
const webpack = require('webpack')

// noinspection JSUnusedGlobalSymbols
export const withShlikshlak = async (nextConfig: {
  webpack?: (config: Configuration, context: { isServer: string }) => Configuration
}) => {
  return Object.assign({}, nextConfig, {
    webpack(config: Configuration, context: { isServer: string }) {
      const originalEntry = config.entry

      const devtoolsPath = resolve(__dirname, 'Devtools.cjs')
      if (!context.isServer) {
        config.plugins!.push(new PrependTextWebpackPlugin())
        config.entry = async () => {
          const entries = await (originalEntry as any)() // Always a function in Next
          if (!entries['main.js'].includes(devtoolsPath) && !Array.isArray(entries['react-refresh'])) {
            entries['main.js'].unshift(devtoolsPath)
          }
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

const { RawSource } = webpack.sources
const PROCESS_ASSETS_STAGE_ADDITIONS = webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS

class PrependTextWebpackPlugin {
  apply(compiler: Compiler): void {
    compiler.hooks.thisCompilation.tap('ShlikshlakWebpackPlugin', (compilation) => {
      compilation.hooks.processAssets.tapPromise(
        {
          name: 'ShlikshlakWebpackPlugin',
          stage: PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        async () => {
          const targetFile = compilation.namedChunks.get('react-refresh')?.files.values().next().value
          const targetText = await fs.readFile(resolve(__dirname, 'hook.cjs'), 'utf-8')

          if (compilation.assets[targetFile]) {
            const originalContent = compilation.assets[targetFile].source()
            const newContent = targetText.replaceAll(/"use strict"/g, '') + '\n' + originalContent
            compilation.updateAsset(targetFile, new RawSource(newContent))
          }
        }
      )
    })
  }
}
