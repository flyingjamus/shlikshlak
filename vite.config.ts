import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

import { buildSync } from 'esbuild'
const bundleWorker = () => {
  return {
    name: 'vite-plugin-bundle-worker',
    transform(_, id) {
      // if the file name end with '?worker'
      if (/\?worker/.test(id)) {
        // remove '?worker' from id
        id = id.replace(/\?[\w-]+/, '')
        // bundle the source code ( which resolves import/export )
        const code = buildSync({
          bundle: true,
          entryPoints: [id],
          minify: true,
          write: false, // required in order to retrieve the result code
        }).outputFiles[0].text
        // const url = this.emitFile({
        //   fileName: id.match(/[\w\.-\_\/]+\/([\w\.-\_]+)$/)[1], // get file name
        //   type: 'asset',
        //   source: code,
        // })
        // now the file ends with '?worker' would be treated as a code which exports Worker constructor
        return {
          code,
        }
      }
    },
  }
}

console.log(resolve(__dirname,'src'))
export default defineConfig({
  build: {
    // rollupOptions: {
    //   output: {
    //     manualChunks: {
    //       tsWorker: [`src/override.worker.tsx`],
    //     },
    //   },
    // },
  },
  clearScreen: false,
  plugins: [
    // bundleWorker(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: resolve(__dirname,'src'),
      filename: 'my-sw.ts',
      registerType: 'prompt',
      injectRegister: 'auto',
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
    react({
      babel: {
        plugins: [
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
    // 'document': {}
  },
})
