import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';
export default defineConfig({
    optimizeDeps: {
        include: ['typescript'],
    },
    build: {
        commonjsOptions: {
            include: [/typescript/, /node_modules/],
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
        VitePWA({
            strategies: 'injectManifest',
            srcDir: resolve(__dirname, 'src'),
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
});
