import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

import { buildSync } from 'esbuild'

export default defineConfig({
  optimizeDeps: {
    include: ['typescript'],
  },
  build: {
    commonjsOptions: {
      include: [/typescript/],
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        stories: resolve(__dirname, 'stories/index.html'),
      },
    },
  },
  clearScreen: false,
  plugins: [
    // bundleWorker(),
    // {
    //   name: 'watch-node-modules',
    //   configureServer: (server) => {
    //     server.watcher.options = {
    //       ...server.watcher.options,
    //       ignored: ['**/node_modules/!(typescript)/**', '**/.git/**'],
    //     }
    //   },
    // },

    {
      name: 'middleware',
      apply: 'serve',
      configureServer(viteDevServer) {
        return () => {
          viteDevServer.middlewares.use(async (req, res, next) => {
            if (req.originalUrl.startsWith('/stories')) {
              req.url = '/src/stories/index.html'
            }

            next()
          })
        }
      },
    },
    VitePWA({
      // strategies: 'generateSW',
      srcDir: resolve(__dirname, 'src'),
      filename: 'my-sw.ts',
      // registerType: 'prompt',
      // injectRegister: 'inline',
      // devOptions: {
      //   enabled: true,
      //   type: 'module',
      // },
    }),
    react({
      babel: {
        plugins: [
          // BabelPluginReactJSXSource,
          [
            '@emotion',
            {
              importMap: {
                '@mui/system': {
                  styled: {
                    canonicalImport: ['@emotion/styled', 'default'],
                    styledBaseImport: ['@mui/system', 'styled'],
                  },
                },
                '@mui/core': {
                  styled: {
                    canonicalImport: ['@emotion/styled', 'default'],
                    styledBaseImport: ['@mui/core', 'styled'],
                  },
                },
                '@mui/material': {
                  styled: {
                    canonicalImport: ['@emotion/styled', 'default'],
                    styledBaseImport: ['@mui/material', 'styled'],
                  },
                },
                '@mui/material/styles': {
                  styled: {
                    canonicalImport: ['@emotion/styled', 'default'],
                    styledBaseImport: ['@mui/material/styles', 'styled'],
                  },
                },
              },
            },
          ],
        ],
      },
    }),
  ],
  define: {
    'process.env': {},
    __DEV__: true,
  },
})
