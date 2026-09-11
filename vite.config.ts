import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';


// eslint-disable-next-line no-restricted-exports
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        // Deploying under a sub-path is possible via VITE_BASE_PATH (e.g. `/api-docs/`).
        // Defaults to the site root.
        base: env.VITE_BASE_PATH || '/',
        plugins: [
            react(),
            nodePolyfills({
                include: ['fs', 'util', 'stream', 'http', 'https', 'url', 'zlib', 'path']
            })
        ],
        build: {
            outDir: 'build',
            // Source maps are only useful while developing: do not ship sources in the static bundle.
            sourcemap: mode !== 'production',
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
