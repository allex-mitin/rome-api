import type { Service, UiSettings } from '../types'
import { getLoadedSettings } from './index'

/**
 * The effective `ui` settings: what `settings.yml` provides over the defaults below.
 *
 * The section is read in the browser, so these are read on every render. That is on purpose: the
 * settings are resolved once per page load (`settingsLoader` on the root route awaits them), and the
 * shell must know the answer *before* it paints — otherwise the service list would flash for a tick
 * on a deployment that hides it.
 */
export const getUiSettings = (): Required<UiSettings> => ({
    hideServiceListWhenSingle: getLoadedSettings()?.ui?.hideServiceListWhenSingle ?? false,
})

/**
 * Whether the service list must not be rendered at all.
 *
 * Only a genuinely redundant list is dropped: exactly one service is configured (so the list offers
 * no choice) **and** the deployment asked for it. Zero services and two or more keep the current
 * layout, as does a configuration without the flag.
 *
 * Callers must have the settings in memory already — every route of the shell goes through
 * `settingsLoader` (see `src/components/App.tsx`).
 */
export const isServiceListHidden = (services: Service[]): boolean =>
    services.length === 1 && getUiSettings().hideServiceListWhenSingle
