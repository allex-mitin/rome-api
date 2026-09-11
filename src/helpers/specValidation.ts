import { bundleSpec, formatOf, parseSpec, resolveJsonPointer, type FetchLike, type SpecFormat } from './specBundler';

/**
 * Collects problems found in a spec so they can be shown in a panel instead of being
 * silently swallowed by the renderers.
 *
 * Two sources are used:
 * - AsyncAPI: the diagnostics of `@asyncapi/parser` (authoritative, backed by Spectral).
 * - OpenAPI: the checks below, since there is no lightweight validator available.
 *
 * Structural checks run on the *raw* root document rather than on the bundled one: after
 * bundling, `#/...` references coming from external files would point into the root
 * document's scope and produce false positives.
 */

export type DiagnosticSeverity = 'error' | 'warning' | 'info';

export interface Diagnostic {
    severity: DiagnosticSeverity;
    message: string;
    /** Human-readable location, e.g. `paths./pet.get` or `components.schemas.Pet`. */
    location?: string;
}

export interface SpecDiagnostics {
    format: SpecFormat;
    diagnostics: Diagnostic[];
}

/**
 * Structural shape of a Spectral diagnostic as returned by `@asyncapi/parser`.
 * Declared locally to avoid an implicit dependency on `@stoplight/spectral-core`.
 */
interface SpectralLikeDiagnostic {
    code?: string | number;
    message: string;
    /** 0 — error, 1 — warning, 2 — information, 3 — hint */
    severity: number;
    path?: Array<string | number>;
}

const SEVERITY_BY_INDEX: readonly DiagnosticSeverity[] = ['error', 'warning', 'info', 'info'];

export const fromSpectralDiagnostic = (diagnostic: SpectralLikeDiagnostic): Diagnostic => ({
    severity: SEVERITY_BY_INDEX[diagnostic.severity] ?? 'info',
    message: diagnostic.message,
    location: diagnostic.path?.length ? diagnostic.path.join('.') : undefined,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const collectRefs = (value: unknown, found: string[] = []): string[] => {
    if (Array.isArray(value)) {
        value.forEach((item) => collectRefs(item, found));
        return found;
    }
    if (!isRecord(value)) {
        return found;
    }
    for (const [key, child] of Object.entries(value)) {
        if (key === '$ref' && typeof child === 'string') {
            found.push(child);
        } else {
            collectRefs(child, found);
        }
    }
    return found;
};

export const validateOpenApiDocument = (document: unknown): Diagnostic[] => {
    const diagnostics: Diagnostic[] = [];

    if (!isRecord(document)) {
        return [{ severity: 'error', message: 'Документ спецификации не является объектом' }];
    }

    if (typeof document.swagger !== 'string' && typeof document.openapi !== 'string') {
        diagnostics.push({
            severity: 'error',
            message: 'Не найден ни `openapi`, ни `swagger` — документ не похож на OpenAPI-спецификацию',
        });
    }

    if (!isRecord(document.info)) {
        diagnostics.push({ severity: 'error', message: 'Отсутствует обязательный блок `info`' });
    } else {
        if (typeof document.info.title !== 'string' || document.info.title === '') {
            diagnostics.push({ severity: 'error', message: 'В блоке `info` не заполнен `title`', location: 'info.title' });
        }
        if (typeof document.info.version !== 'string' || document.info.version === '') {
            diagnostics.push({ severity: 'error', message: 'В блоке `info` не заполнен `version`', location: 'info.version' });
        }
    }

    if (!isRecord(document.paths) && !isRecord(document.webhooks)) {
        diagnostics.push({ severity: 'error', message: 'Отсутствует блок `paths`' });
    } else if (isRecord(document.paths) && Object.keys(document.paths).length === 0) {
        diagnostics.push({ severity: 'warning', message: 'В блоке `paths` не описано ни одной операции' });
    }

    const seen = new Set<string>();
    for (const ref of collectRefs(document)) {
        if (!ref.startsWith('#') || seen.has(ref)) {
            continue;
        }
        seen.add(ref);
        let missing = false;
        try {
            missing = resolveJsonPointer(document, ref.slice(1)) === undefined;
        } catch {
            missing = true;
        }
        if (missing) {
            diagnostics.push({ severity: 'error', message: `Внутренняя ссылка не найдена: ${ref}`, location: ref });
        }
    }

    return diagnostics;
};

/**
 * @param url spec URL, absolute or relative to `baseUrl`
 * @param baseUrl page origin by default; injectable so the checks can run outside a browser
 */
export const loadSpecDiagnostics = async (
    url: string,
    baseUrl: string = window.location.origin,
    fetchFn: FetchLike = fetch
): Promise<SpecDiagnostics> => {
    const absolute = new URL(url, baseUrl).toString();
    const format = formatOf(absolute);
    const diagnostics: Diagnostic[] = [];

    // Structure and internal references — on the untouched root document (see the module comment).
    try {
        const response = await fetchFn(absolute);
        if (!response.ok) {
            return { format, diagnostics: [{ severity: 'error', message: `Не удалось загрузить спецификацию: ${response.status}` }] };
        }
        diagnostics.push(...validateOpenApiDocument(parseSpec(await response.text(), absolute)));
    } catch (cause) {
        return { format, diagnostics: [{ severity: 'error', message: cause instanceof Error ? cause.message : String(cause) }] };
    }

    // External references — a separate pass, so a broken link is reported without shifting `#/...` scopes.
    try {
        await bundleSpec(absolute, fetchFn);
    } catch (cause) {
        diagnostics.push({
            severity: 'error',
            message: `Не удалось собрать внешние ссылки: ${cause instanceof Error ? cause.message : String(cause)}`,
        });
    }

    return { format, diagnostics };
};
