import type { Settings } from './src/types';

declare global {
    interface Window {
        // Provided either by `public/settings.js` or loaded from `settings.yml`.
        settings: () => Settings
    }
}

export {};
