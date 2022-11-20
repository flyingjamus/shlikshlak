import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

import { buildSync } from 'esbuild'

export default defineConfig({
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, 'src/StorybookFrame/Devtools.ts'),
      name: 'Devtools',
      // the proper extensions will be added
      fileName: 'devtools',
      // formats: ['es']
    },
  },
  clearScreen: false,
  define: {
    __DEV__: false,
  },
})
