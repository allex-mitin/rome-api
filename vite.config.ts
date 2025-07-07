import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';


// eslint-disable-next-line no-restricted-exports
export default defineConfig({
    plugins: [
        react(),
        // nodePolyfills({
        //     include: ['util', 'fs']
        // })
    ],
    build: {
        outDir: 'build',
        sourcemap: true,
        // rollupOptions: {
        //     output: {
        //         entryFileNames: `assets/[name].js?[hash]`,
        //         chunkFileNames: `assets/[name].js?[hash]`,
        //         assetFileNames: `assets/[name].[ext]?[hash]`,
        //     },
        // }
    },
    server: {
        port: 3000,
    },
    define: {
        'process.env': process.env,
    }
});
