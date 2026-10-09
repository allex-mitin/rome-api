import { DocumentationType } from "../models/DocumentationType";
import type { Service, Settings, Spec } from "../types";
import yaml from 'js-yaml'

let resolvedSettings: Settings | null = null

/**
 * The path the app is served from, read from the document at runtime.
 *
 * Nothing is baked in at build time (`base: './'` in vite.config.mts), so one artifact has to work
 * from the site root (`/`), from a sub-path (`/api-ui/`) and on GitHub Pages (`/rome-api/`). The
 * mount path is pinned by the `<base href>` tag in `index.html` — the host replaces that single tag
 * — and `document.baseURI` is that value, so this is the one place the runtime base is derived.
 *
 * Always ends with a slash (`/`, `/api-ui/`): that makes `${ appBase() }settings.yml` and
 * `appBase().replace(/\/$/, '') + url` both come out right. Loading `index.html` directly (no tag,
 * as in `npm run dev`) gives the directory of the document, which is the same answer.
 */
export const appBase = (): string => new URL('.', document.baseURI).pathname

/**
 * The effective settings: the YAML file when it is available, the `window.settings` fallback
 * (provided by `public/settings.js`) otherwise.
 */
export const getSettings = async (): Promise<Settings | null> => {
    const yamlSettings = await loadYamlSettings()
    if (yamlSettings !== null) {
        resolvedSettings = yamlSettings
        return yamlSettings
    }
    try {
        resolvedSettings = window.settings?.() ?? null
    } catch {
        // A broken `settings.js` must not take the whole app down.
        resolvedSettings = null
    }
    return resolvedSettings
}

/**
 * The settings that have already been read, without awaiting.
 *
 * Every route that renders a spec goes through `serviceLoader`, which awaits `getSettings`, so by the
 * time a renderer is mounted this is filled in. Callers must still cope with `null` (the first paint
 * of the app, a route without a loader) — there the renderers fall back to their built-in defaults.
 */
export const getLoadedSettings = (): Settings | null => resolvedSettings

/**
 * The services from the settings that are already in memory.
 *
 * The shell (the service list, the header search) needs the list to decide what to render, and it
 * needs that answer synchronously: an async read would paint the list first and hide it a tick later.
 * The root route awaits the settings before it renders anything (`settingsLoader` in
 * `src/components/App.tsx`), so for a rendered shell this is filled in; before that first read it is
 * empty, which is exactly what a deployment without a settings file should show.
 */
export const getLoadedServices = (): Service[] => getLoadedSettings()?.services ?? []

export const Services = async (): Promise<Service[]> => {
    return (await getSettings())?.services ?? []
}

export const getService = async (path: string | undefined) => {
    if (path === undefined) {
        return undefined;
    }
    const services = await Services()
    return services.find(s => s.path === path)
}

const loadSettingsFile = async (link: string): Promise<Settings | null> => {
    // The file is served next to the built assets, so it is addressed from the app base and not from
    // the site root: under a sub-path deployment those two differ, and a root-absolute URL would
    // leave the app entirely.
    const response = await fetch(`${ appBase() }${ link }`)
    if (!response.ok) {
        return null
    }
    const text = await response.text()
    const settings = yaml.load(text)

    if (settings === null || typeof settings !== 'object') {
        return null
    }
    return settings as Settings
}

let settingsPromise: Promise<Settings | null> | null = null

/**
 * Reads the settings file once per page load.
 *
 * It is not a build artifact: it is served next to the frontend and edited by the deployment
 * (service list, header branding). The navigator, the service loaders, the global search and the
 * header all need it, so the promise is shared instead of fetching the same file several times.
 */
const loadYamlSettings = (): Promise<Settings | null> => {
    if (settingsPromise === null) {
        settingsPromise = (async () => {
            try {
                // `settings.yml` has priority, `settings.yaml` is kept as a legacy fallback.
                const settings = (await loadSettingsFile('settings.yml')) ?? (await loadSettingsFile('settings.yaml'))

                if (settings !== null) {
                    window.settings = () => settings
                }
                return settings
            } catch {
                // If YAML settings are unavailable we keep whatever `window.settings` already provides
                // (e.g. the `public/settings.js` fallback).
                return null
            }
        })()
    }
    return settingsPromise
}

export const hasOpenApi = (service: Service | undefined): boolean => {
    return service != undefined && service.openapi != undefined && (service.openapi.url != undefined || service.openapi.urls != undefined);
}

export const hasAsyncApi = (service: Service | undefined): boolean => {
    return service != undefined && service.asyncapi != undefined && (service.asyncapi.url != undefined || service.asyncapi.urls != undefined);
}

/**
 * Addresses a spec URL from `settings.yml` / `settings.js` from the app base.
 *
 * Specs are deployed next to the built assets, so in the configuration they are written from the
 * site root (`/test/single-file/openapi.json`). Under a sub-path deployment (GitHub Pages at
 * `/rome-api/`, a Spring Boot app at `/api-ui/`) the very same file lives under that sub-path, and a
 * root-absolute URL leaves the app: nginx/Vite/Pages answer with the SPA fallback, so the renderer
 * gets `index.html` instead of a spec and reports an "HTML instead of a spec" error.
 *
 * With the app served from the root (`appBase() === '/'`) this is a no-op. External (`https://...`)
 * and relative URLs are left untouched — where they point is decided by the deployment, not by the
 * app.
 */
const resolveSpecUrl = (url: string): string => {
    if (!url.startsWith('/')) {
        return url
    }
    // `appBase()` always ends with a slash, and `/` means "no prefix to add".
    return appBase().replace(/\/$/, '') + url
}

export const getSpecification = (service: Service | undefined, documentation: string | undefined, version: string | undefined) => {
    if (service == null) {
        return null
    }
    return {
        type(): DocumentationType | null {
            if (documentation == null) {
                if (hasOpenApi(service)) return DocumentationType.OPENAPI;
                if (hasAsyncApi(service)) return DocumentationType.ASYNCAPI;
                return null
            }
            switch (documentation.toLowerCase()) {
                case "openapi":
                    return DocumentationType.OPENAPI;
                case "asyncapi" :
                    return DocumentationType.ASYNCAPI;
                default:
                    return null;
            }
        },
        spec(): Spec | null {
            switch (this.type()) {
                case DocumentationType.OPENAPI:
                    return service.openapi ?? null
                case DocumentationType.ASYNCAPI:
                    return service.asyncapi ?? null
                default:
                    return null;
            }
        },
        urls(): Map<string, string> {
            const spec = this.spec();
            const urls = new Map<string, string>
            if (spec?.url) {
                urls.set("default", resolveSpecUrl(spec.url))
            }
            if (spec?.urls) {
                Object.entries(spec.urls).forEach(([key, value]) => {
                    urls.set(key, resolveSpecUrl(value))
                })
            }
            return urls;
        },
        currentUrl() {
            const urls = this.urls();

            if (!version) {
                const defaultUrl = urls.get("default");
                if (defaultUrl) return { version: "default", url: defaultUrl };

                const [firstVersion, firstUrl] = urls.entries().next().value || [];
                if (firstVersion) return { version: firstVersion, url: firstUrl };

                return null;
            }

            const url = urls.get(version);
            return url ? { version, url } : null;
        },
        defaultUrl() {
            const urls = this.urls();

            const defaultUrl = urls.get("default");
            if (defaultUrl) return { version: "default", url: defaultUrl };

            const [firstVersion, firstUrl] = urls.entries().next().value || [];
            if (firstVersion) return { version: firstVersion, url: firstUrl };

            return null;

        },


    }
}
