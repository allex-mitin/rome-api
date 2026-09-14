import { DocumentationType } from "../models/DocumentationType";
import type { Service, Settings, Spec } from "../types";
import yaml from 'js-yaml'

let resolvedSettings: Settings | null = null

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
    const response = await fetch(`/${ link }`)
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
                urls.set("default", spec.url)
            }
            if (spec?.urls) {
                Object.entries(spec.urls).forEach(([key, value]) => {
                    urls.set(key, value)
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
