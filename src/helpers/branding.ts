import { useEffect, useState } from 'react';

import defaultLogo from '../assets/logo.svg';
import type { Branding } from '../types';
import { getSettings } from './index';

/**
 * Branding of the header, read at runtime from `settings.yml`.
 *
 * The file is served next to the built static files (see `deploy/nginx.conf.example`), so an
 * organisation can put its own logo, name and colours into the header by editing that file and
 * reloading the page — the frontend does not have to be rebuilt.
 */
export interface ResolvedBranding {
    title: string
    /** An empty string hides the line. */
    subtitle: string
    logo: string
    logoAlt: string
    logoHeight: number
    link: string
    /** Any CSS `background` value: a colour, a gradient or `url(...)`. */
    background: string
    textColor: string
    accentColor: string
    documentTitle: string
    favicon?: string
}

export const DEFAULT_BRANDING: ResolvedBranding = {
    title: 'Rome API',
    subtitle: 'View API documentation service',
    logo: defaultLogo,
    logoAlt: 'Rome API',
    logoHeight: 32,
    link: '/',
    // A shade darker than the page (`--app-surface`), so the header reads as its own zone without
    // a border or a shadow — any rule under an opaque header looks like a stripe.
    background: '#f8fafc',
    textColor: '#101828',
    accentColor: '#4696e5',
    documentTitle: 'Rome API',
};

/** Falls back to `fallback` for anything the settings file may omit or leave blank. */
const filled = <T,>(value: T | null | undefined, fallback: T): T => {
    if (value === null || value === undefined) {
        return fallback;
    }
    if (typeof value === 'string' && value.trim() === '') {
        return fallback;
    }
    return value;
};

const optional = (value: unknown): string | undefined =>
    typeof value === 'string' && value.trim() !== '' ? value : undefined;

/**
 * `logoHeight` is documented as pixels, but a settings file is hand-written: `"32"` is accepted
 * just as well, and anything unusable falls back to the default.
 */
const pixels = (value: unknown, fallback: number): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const resolveBranding = (source?: Branding | null): ResolvedBranding => ({
    title: filled(source?.title, DEFAULT_BRANDING.title),
    // The only key where an empty value is meaningful: it removes the subtitle.
    subtitle: source?.subtitle ?? DEFAULT_BRANDING.subtitle,
    logo: filled(source?.logo, DEFAULT_BRANDING.logo),
    logoAlt: filled(source?.logoAlt, filled(source?.title, DEFAULT_BRANDING.logoAlt)),
    logoHeight: pixels(source?.logoHeight, DEFAULT_BRANDING.logoHeight),
    link: filled(source?.link, DEFAULT_BRANDING.link),
    background: filled(source?.background, DEFAULT_BRANDING.background),
    textColor: filled(source?.textColor, DEFAULT_BRANDING.textColor),
    accentColor: filled(source?.accentColor, DEFAULT_BRANDING.accentColor),
    documentTitle: filled(source?.documentTitle, filled(source?.title, DEFAULT_BRANDING.documentTitle)),
    favicon: optional(source?.favicon),
});

let brandingPromise: Promise<ResolvedBranding> | null = null;

/**
 * Loads the branding once per page load. The header, the search field and the app shell ask for it
 * at the same time, and the shared promise plus the cached settings keep that to a single request.
 */
export const loadBranding = (): Promise<ResolvedBranding> => {
    if (brandingPromise === null) {
        brandingPromise = getSettings()
            .then((settings) => resolveBranding(settings?.branding))
            .catch(() => DEFAULT_BRANDING);
    }
    return brandingPromise;
};

/**
 * React binding for the branding. The default branding is rendered immediately and replaced as soon
 * as `settings.yml` has been read, so the app never waits on the configuration to paint.
 */
export const useBranding = (): ResolvedBranding => {
    const [branding, setBranding] = useState<ResolvedBranding>(DEFAULT_BRANDING);

    useEffect(() => {
        let cancelled = false;
        loadBranding().then((loaded) => {
            if (!cancelled) {
                setBranding(loaded);
            }
        });
        return () => {
            cancelled = true;
        };
    }, []);

    return branding;
};

/**
 * Applies the branding that lives outside the header: the browser tab, the favicon and the accent
 * colour that the stylesheet reads through `var(--app-accent)`.
 *
 * The tab title and the favicon are optional: a deployment that only rebrands the header keeps the
 * shipped ones unless it sets `documentTitle`/`favicon` explicitly.
 */
export const applyDocumentBranding = (branding: ResolvedBranding): void => {
    if (document.title !== branding.documentTitle) {
        document.title = branding.documentTitle;
    }
    document.documentElement.style.setProperty('--app-accent', branding.accentColor);
    if (!branding.favicon) {
        return;
    }
    let link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
    if (link === null) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
    }
    if (link.getAttribute('href') !== branding.favicon) {
        link.setAttribute('href', branding.favicon);
        // The shipped icon is an `.ico`; a custom one may be a png/svg, so do not keep a stale type.
        link.removeAttribute('type');
    }
};
