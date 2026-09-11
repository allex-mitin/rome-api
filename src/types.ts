/**
 * Shape of the `settings.yml` (or `settings.js` fallback) consumed by the app.
 * Kept in a real module so the types can be imported explicitly instead of
 * relying on ambient global declarations.
 */
export interface Settings {
    services: Service[]
}

export interface Service {
    path: string
    name: string
    openapi?: Spec
    asyncapi?: Spec
}

export interface Spec {
    url?: string
    urls?: Record<string, string>
}
