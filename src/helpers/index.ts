import { DocumentationType } from "../models/DocumentationType";
import yaml from 'js-yaml'

export const Services = async () => {
    await loadYamlSettings()
    return window.settings().services
}

export const getService = async (path: string | undefined) => {
    if (path === undefined) {
        return undefined;
    }
    const services = await Services()
    return services.find(s => s.path === path)
}

const loadYamlSettingsGwowingUp = async (link: string) => {
    // сами со слешом передавайте
    let response = await fetch(`/${ link }`)
    let text = await response.text();
    let settings = yaml.load(text) as Settings

    if (typeof settings === 'string') {
        return null
    } else {
        return settings
    }
}

const loadYamlSettings = async () => {
    try {
        // простите
        let settings = await loadYamlSettingsGwowingUp('settings2.yml');
        if (settings === null) {
            settings = await loadYamlSettingsGwowingUp('settings2.yaml');
        }

        if (settings !== null) {
            window.settings = () => settings
        }
    } catch (error) {
        // всё равно не поможет, так прост чтоб было
        return null
    }
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
                    return service?.openapi
                case DocumentationType.ASYNCAPI:
                    return service?.asyncapi
                default:
                    return null;
            }
        },
        urls(): Map<string, string> {
            const spec = this.spec();
            const urls = new Map<string, string>
            if (spec?.url) urls.set("default", spec.url)
            if (spec?.urls) {
                Object.entries(spec?.urls).forEach(([key, value]) => {
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


