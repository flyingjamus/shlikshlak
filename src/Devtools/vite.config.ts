import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    sourcemap: 'inline',
    commonjsOptions: {
      include: [/node_modules/],
    },
    rollupOptions: {
      external: ['/@react-refresh'],
    },
    lib: {
      entry: [resolve(__dirname, 'Devtools.tsx')],
      name: 'Devtools',
      fileName: (format, entryName) => {
        return `${entryName}.${format === 'cjs' ? 'cjs' : 'js'}`
      },
      // formats: ['es']
    },
  },
  clearScreen: false,
  define: {
    __DEV__: false,
  },
})
