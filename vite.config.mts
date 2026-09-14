import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { visualizer } from 'rollup-plugin-visualizer';


// eslint-disable-next-line no-restricted-exports
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    // Set by `npm run analyze` (scripts/analyze.mjs). The report is taken from a real
    // production build, so it does not affect `mode` or any other build setting.
    const isAnalyze = process.env.ANALYZE === '1';

    return {
        // Deploying under a sub-path is possible via VITE_BASE_PATH (e.g. `/api-docs/`).
        // Defaults to the site root.
        base: env.VITE_BASE_PATH || '/',
        resolve: {
            alias: {
                // Browser build: use native `fetch` instead of `node-fetch`, which drags
                // `browserify-zlib` -> `pako` and `readable-stream` into the AsyncAPI chunk
                // and also forces the http/https/zlib/stream polyfills to stay enabled.
                'node-fetch': path.resolve(process.cwd(), 'src/shims/node-fetch.cjs'),
            },
        },
        plugins: [
            react(),
            nodePolyfills({
                include: ['fs', 'util', 'stream', 'http', 'https', 'url', 'zlib', 'path'],
                // `@asyncapi/parser` imports `readFile` from `fs` at module scope although it only
                // uses it on its Node path. The default polyfill points `fs` at an export-less mock,
                // which breaks the build under an ESM Vite config (MISSING_EXPORT).
                overrides: {
                    fs: path.resolve(process.cwd(), 'src/shims/fs.cjs'),
                },
            }),
            ...(isAnalyze
                ? [
                    // Human-readable treemap: build/stats.html
                    visualizer({ filename: 'build/stats.html', template: 'treemap', gzipSize: true }),
                    // Machine-readable data for scripted analysis: build/stats.json
                    visualizer({ filename: 'build/stats.json', template: 'raw-data' }),
                ]
                : [])
        ],
        build: {
            outDir: 'build',
            // Source maps are only useful while developing: do not ship sources in the static bundle.
            sourcemap: mode !== 'production',
            rollupOptions: {
                output: {
                    // One JS file for the whole app (`assets/index-*.js`) instead of an entry plus a
                    // chunk per renderer. Rollup splits the bundle because both renderers are dynamic
                    // imports (`Documentation.tsx`) and the validators are shared between them; inlining
                    // the dynamic imports puts all of it into the entry chunk, so the build ships a
                    // predictable minimum of files to deploy.
                    //
                    // The price is on the first paint: the single bundle is ~6.8 MB raw / ~1.6 MB
                    // gzip, so the AsyncAPI renderer (~5 MB) is downloaded even when only an OpenAPI
                    // spec is opened. That is acceptable for a documentation viewer, but it is a real
                    // trade-off — if the first-load size starts to matter, removing this line restores
                    // the split (entry + one chunk per renderer + the shared validators).
                    inlineDynamicImports: true,
                },
            },
        },
        server: {
            port: 3000,
        },
        define: {
            // SECURITY: never inline the whole build machine environment into the client bundle.
            // Only an explicit, safe subset is exposed to the frontend.
            'process.env': JSON.stringify({ NODE_ENV: mode }),
        }
    }
});
