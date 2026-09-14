import type { AsyncApiOptions, OpenApiOptions, Service } from '../types'
import { getLoadedSettings } from './index'

/**
 * Renderer options.
 *
 * Both renderers used to be configured by hardcoded objects in the pages. Now those objects are only
 * the *baseline*: the effective options are the baseline, then the `renderers` section of the settings
 * file, then the options of the concrete spec (`services[].openapi.options`). Everything is
 * optional, so a deployment overrides only what it needs — without rebuilding the frontend.
 */

export const DEFAULT_OPENAPI_OPTIONS: OpenApiOptions = {
    // A large spec is unreadable as one wall of operations: the list is collapsed by default
    // (`list`), swagger-ui's own filter narrows it down, and the models section (which renders every
    // schema) stays closed until asked for.
    docExpansion: 'list',
    filter: true,
    defaultModelsExpandDepth: -1,
    deepLinking: true,
}

export const DEFAULT_ASYNCAPI_OPTIONS: AsyncApiOptions = {
    schemaID: 'asyncapi',
    show: {
        sidebar: false,
        info: true,
        servers: true,
        operations: true,
        messages: true,
        messageExamples: true,
        schemas: true,
        errors: true,
    },
    expand: {
        messageExamples: false,
    },
    sidebar: {
        showServers: 'byDefault',
        showOperations: 'byDefault',
        useChannelAddressAsIdentifier: true,
    },
    parserOptions: {},
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Recursive merge of the renderer options.
 *
 * The settings file is hand-written, so a service has to be able to override a single nested key
 * (`show.sidebar`) without repeating the whole section. Arrays and scalars are replaced as a whole;
 * `null` and `undefined` count as "not specified" — an empty `show:` in YAML parses to `null` and
 * must not wipe the defaults. Nested objects of `base` are never mutated.
 */
export const mergeOptions = <T extends object>(base: T, ...overrides: Array<object | null | undefined>): T => {
    const result: Record<string, unknown> = { ...(base as Record<string, unknown>) }

    overrides.forEach((override) => {
        if (!isPlainObject(override)) {
            return
        }
        Object.entries(override).forEach(([key, value]) => {
            if (value === undefined || value === null) {
                return
            }
            const current = result[key]
            result[key] = isPlainObject(current) && isPlainObject(value)
                ? mergeOptions(current, value)
                : value
        })
    })

    return result as T
}

/**
 * Keys that only make sense in `settings.js`: `swagger-ui-react` spreads `presets`/`plugins` and calls
 * the interceptors while building its system, so a string or a number in their place (`presets: 20`)
 * throws synchronously and takes the whole route down.
 */
const FUNCTION_KEYS = ['onComplete', 'requestInterceptor', 'responseInterceptor']
const ARRAY_KEYS = ['presets', 'plugins']

const sanitize = (options: OpenApiOptions): OpenApiOptions => {
    const result = { ...options } as Record<string, unknown>

    // `url`/`spec` are owned by `services[].openapi`. The types keep them out, but the settings file is
    // cast, not validated — a `spec` smuggled through the config would make swagger-ui render it first
    // and only then swap to the real document.
    delete result.url
    delete result.spec

    ARRAY_KEYS.forEach((key) => {
        if (result[key] !== undefined && !Array.isArray(result[key])) {
            delete result[key]
        }
    })
    FUNCTION_KEYS.forEach((key) => {
        if (result[key] !== undefined && typeof result[key] !== 'function') {
            delete result[key]
        }
    })

    return result as OpenApiOptions
}

/** Effective swagger-ui options: baseline → `renderers.openapi` → the spec's own `options`. */
export const openApiOptions = (service?: Service): OpenApiOptions =>
    sanitize(mergeOptions(DEFAULT_OPENAPI_OPTIONS, getLoadedSettings()?.renderers?.openapi, service?.openapi?.options))

/** Effective AsyncAPI options: baseline → `renderers.asyncapi` → the spec's own `options`. */
export const asyncApiOptions = (service?: Service): AsyncApiOptions =>
    mergeOptions(DEFAULT_ASYNCAPI_OPTIONS, getLoadedSettings()?.renderers?.asyncapi, service?.asyncapi?.options)
