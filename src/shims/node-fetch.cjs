// Browser stand-in for `node-fetch`, wired up via `resolve.alias` in vite.config.ts.
//
// Why: in a browser bundle the native `fetch` already exists, while `node-fetch` (pulled in
// by `@asyncapi/parser` through `@stoplight/json-ref-readers` and `@stoplight/spectral-runtime`)
// drags `browserify-zlib` -> `pako` and `readable-stream` with it, adding around 860 kB to the
// AsyncAPI chunk. It also forced the `http`/`https`/`zlib`/`stream` node polyfills to be enabled.
//
// The export shape mirrors node-fetch v2: `module.exports` is the callable fetch function with
// the API classes attached, so both `require('node-fetch')` and `import fetch from 'node-fetch'`
// keep working.
const globalScope = globalThis;

const nativeFetch = globalScope.fetch.bind(globalScope);

class FetchError extends Error {
    constructor(message, type, systemError) {
        super(message);
        this.name = 'FetchError';
        this.type = type;
        this.systemError = systemError;
    }
}

module.exports = nativeFetch;
module.exports.default = nativeFetch;
module.exports.Headers = globalScope.Headers;
module.exports.Request = globalScope.Request;
module.exports.Response = globalScope.Response;
module.exports.FormData = globalScope.FormData;
module.exports.AbortController = globalScope.AbortController;
module.exports.FetchError = FetchError;
