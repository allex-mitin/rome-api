import {DocumentationType} from "../models/DocumentationType";

export const Services = (): Array<Service> => {
    return window.settings().services
}

export const getService = (path: string | undefined): Service | undefined => {
    if (path === undefined) {
        return undefined;
    }
    return window.settings().services.find(s => s.path === path)
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
                if (defaultUrl) return {version: "default", url: defaultUrl};

                const [firstVersion, firstUrl] = urls.entries().next().value || [];
                if (firstVersion) return {version: firstVersion, url: firstUrl};

                return null;
            }

            const url = urls.get(version);
            return url ? {version, url} : null;
        },
        defaultUrl() {
            const urls = this.urls();

            const defaultUrl = urls.get("default");
            if (defaultUrl) return {version: "default", url: defaultUrl};

            const [firstVersion, firstUrl] = urls.entries().next().value || [];
            if (firstVersion) return {version: firstVersion, url: firstUrl};

            return null;

        },


    }
}


