import type { ComponentProps } from 'react';
import type SwaggerUI from 'swagger-ui-react';
import type { ConfigInterface } from '@asyncapi/react-component';

/**
 * Shape of the `settings.yml` (or `settings.js` fallback) consumed by the app.
 * Kept in a real module so the types can be imported explicitly instead of
 * relying on ambient global declarations.
 */
export interface Settings {
    services: Service[]
    branding?: Branding
    /** Default renderer options for every service; a service can override them per spec. */
    renderers?: RendererOptions
}

/**
 * Options of the OpenAPI renderer, passed to `<SwaggerUI>`.
 *
 * Derived from the component itself, so a settings file uses exactly the key names that
 * `swagger-ui-react` forwards. It is a **fixed allow-list**: the wrapper destructures its own props and
 * silently drops everything else, so `maxDisplayedTags`, `fn`, `syntaxHighlight` and friends never reach
 * swagger-ui. `initialState` and `uncaughtExceptionHandler` are forwarded by the wrapper although
 * `@types/swagger-ui-react` does not list them.
 *
 * `url`/`spec` are excluded on purpose: which document to render is decided by `services[].openapi`,
 * not by the renderer options.
 */
export type OpenApiOptions = Partial<Omit<ComponentProps<typeof SwaggerUI>, 'url' | 'spec'>> & {
    initialState?: Record<string, unknown>
    uncaughtExceptionHandler?: (error: unknown) => void
};

/** Options of the AsyncAPI renderer, passed as its `config` prop. */
export type AsyncApiOptions = ConfigInterface;

/** Renderer options shared by all services. */
export interface RendererOptions {
    openapi?: OpenApiOptions
    asyncapi?: AsyncApiOptions
}

export interface Service {
    path: string
    name: string
    openapi?: OpenApiSpec
    asyncapi?: AsyncApiSpec
}

export interface Spec {
    url?: string
    urls?: Record<string, string>
}

export interface OpenApiSpec extends Spec {
    /** Renderer options for this spec; override `renderers.openapi`. */
    options?: OpenApiOptions
}

export interface AsyncApiSpec extends Spec {
    /** Renderer options for this spec; override `renderers.asyncapi`. */
    options?: AsyncApiOptions
}

/**
 * Header branding.
 *
 * Every key is optional: whatever the settings file omits is taken from `DEFAULT_BRANDING`
 * (see `src/helpers/branding.ts`), so a deployment overrides only what it needs — e.g. just `logo`
 * and `title`.
 *
 * The whole section lives in `settings.yml`, which is served next to the built static files and
 * read in the browser, so an organisation can rebrand the header without rebuilding the frontend.
 */
export interface Branding {
    /** Main header text. */
    title?: string
    /** Line under the title. Unlike other keys, an empty string hides it. */
    subtitle?: string
    /** URL of the logo image. Omit to keep the logo bundled with the build. */
    logo?: string
    /** `alt` text of the logo. Defaults to `title`. */
    logoAlt?: string
    /** Logo height in pixels; the width keeps the image aspect ratio. */
    logoHeight?: number
    /** Where the logo and the title lead. External URLs open in a new tab. */
    link?: string
    /** Any CSS `background` value: a colour, a gradient or `url(...)`. */
    background?: string
    /** Colour of the title and the subtitle. */
    textColor?: string
    /** Accent colour: the selected service, focus rings and the search hover. */
    accentColor?: string
    /** Browser tab title. Defaults to `title`. */
    documentTitle?: string
    /** URL of the favicon. Omit to keep the `/favicon.ico` shipped next to the build. */
    favicon?: string
}
