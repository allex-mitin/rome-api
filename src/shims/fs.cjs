// Browser stand-in for the `fs` module, wired up through `nodePolyfills({ overrides })`
// in vite.config.ts.
//
// Why this exists: `@asyncapi/parser/esm/from.js` has a module-scope
//   import { readFile } from 'fs';
// even though `readFile` is only used inside `fromFile()` (its Node.js entry point).
// The default polyfill resolves `fs` to `node-stdlib-browser/.../mock/empty.js`, which has no
// named exports, so under an ESM Vite config Rollup fails the build with:
//   "readFile" is not exported by "node-stdlib-browser/esm/mock/empty.js"
// A CommonJS Vite config used to hide this, because there the CJS mock is connected through
// the CJS interop layer, which does not verify named exports.
//
// This file is deliberately CommonJS (hence `.cjs`) for the same reason: named imports go
// through the interop layer instead of Rollup's static export check.
//
// The application always loads specs with `fromURL`, so none of these functions are reached in
// the browser. They throw a descriptive error instead of failing silently.

const unavailable = (name) => () => {
    throw new Error(`fs.${name} is not available in the browser`);
};

const asyncUnavailable = (name) => async () => {
    throw new Error(`fs.promises.${name} is not available in the browser`);
};

module.exports = {
    readFile: unavailable('readFile'),
    readFileSync: unavailable('readFileSync'),
    writeFile: unavailable('writeFile'),
    writeFileSync: unavailable('writeFileSync'),
    statSync: unavailable('statSync'),
    realpathSync: unavailable('realpathSync'),
    readdirSync: unavailable('readdirSync'),
    // Harmless browser semantics instead of throwing.
    existsSync: () => false,
    sep: '/',
    promises: {
        readFile: asyncUnavailable('readFile'),
        writeFile: asyncUnavailable('writeFile'),
        stat: asyncUnavailable('stat'),
        readdir: asyncUnavailable('readdir'),
    },
};
