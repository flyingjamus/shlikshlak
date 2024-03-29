import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
// import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  resolve: {
    alias: {},
  },
  optimizeDeps: {
    include: ['typescript', 'shlikshlak'],
  },
  build: {
    commonjsOptions: {
      include: [/typescript/g, /shlikshlak/g] as any,
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
    nodePolyfills(),
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
    // VitePWA({
    //   // strategies: 'generateSW',
    //   srcDir: resolve(__dirname, 'src'),
    //   filename: 'my-sw.ts',
    //   // registerType: 'prompt',
    //   // injectRegister: 'inline',
    //   // devOptions: {
    //   //   enabled: true,
    //   //   type: 'module',
    //   // },
    // }),

    // {
    //   name: 'shlikshlak-vite-plugin',
    //   transformIndexHtml: {
    //     order: 'pre',
    //     handler: (html) => {
    //       return [
    //         {
    //           tag: 'script',
    //           attrs: { type: 'module' },
    //           children: 'console.log(11111)',
    //           injectTo: 'head-prepend'
    //         },
    //       ]
    //     },
    //   },
    // },
    react({ jsxImportSource: '@emotion/react' }),
    // react({
    //   jsxImportSource: '@emotion/react',
    //   babel: {
    //     plugins: [
    //       [
    //         '@emotion/babel-plugin',
    //         {
    //           importMap: {
    //             '@mui/system': {
    //               styled: {
    //                 canonicalImport: ['@emotion/styled', 'default'],
    //                 styledBaseImport: ['@mui/system', 'styled'],
    //               },
    //             },
    //             '@mui/core': {
    //               styled: {
    //                 canonicalImport: ['@emotion/styled', 'default'],
    //                 styledBaseImport: ['@mui/core', 'styled'],
    //               },
    //             },
    //             '@mui/material': {
    //               styled: {
    //                 canonicalImport: ['@emotion/styled', 'default'],
    //                 styledBaseImport: ['@mui/material', 'styled'],
    //               },
    //             },
    //             '@mui/material/styles': {
    //               styled: {
    //                 canonicalImport: ['@emotion/styled', 'default'],
    //                 styledBaseImport: ['@mui/material/styles', 'styled'],
    //               },
    //             },
    //           },
    //           sourceMap: true,
    //         },
    //       ],
    //     ],
    //   },
    // }),
  ],
  define: {
    'process.env': {},
    __DEV__: true,
  },
})
