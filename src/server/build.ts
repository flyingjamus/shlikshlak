import * as esbuild from 'esbuild'

await esbuild.build({
    entryPoints: ['src/server/index.ts', 'src/server/ts.ts'],
    bundle: true,
    outdir: 'out/server',
    format: "esm",
    target: "esnext",
    platform: "node",
    banner:{
        js: `
        import { fileURLToPath } from 'url';
        import { createRequire as topLevelCreateRequire } from 'module';
        const require = topLevelCreateRequire(import.meta.url);
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        `
    },
})
