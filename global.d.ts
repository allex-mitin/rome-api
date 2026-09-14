import type { Settings } from './src/types';

declare global {
    interface Window {
        // Provided either by `public/settings.js` or loaded from `settings.yml`.
        // Optional: a deployment may ship neither, then the app renders with an empty service list
        // and the default branding instead of crashing.
        settings?: () => Settings
    }
}

export {};
