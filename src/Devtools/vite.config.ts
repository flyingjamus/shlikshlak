import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    sourcemap: false,
    commonjsOptions: {
      include: [/node_modules/],
    },
    target: 'esnext',
    rollupOptions: {
      external: ['react', 'react-devtools-inline/backend'],
    },
    lib: {
      entry: [
        resolve(__dirname, 'Devtools.ts'),
        resolve(__dirname, 'hook.ts'),
        resolve(__dirname, 'NextjsHook.ts'),
      ],
      name: 'Devtools',
      formats: ['es', 'cjs'],
    },
  },
  clearScreen: false,
  define: {
    __DEV__: false,
  },
})
