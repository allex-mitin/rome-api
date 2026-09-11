import yaml from 'js-yaml';

/**
 * Assembles a spec that is split across several files into a single document.
 *
 * This is the core feature of the project: a root spec references other files through
 * `$ref` (e.g. `./messages/messages.yaml#/components/messages/MqMessage`), which in turn
 * may reference more files. Here those external references are followed and inlined, so the
 * result is a self-contained document that can be downloaded or copied.
 *
 * Internal references (`#/components/...`) are intentionally left untouched: they are already
 * valid inside the resulting document.
 *
 * The module is deliberately free of browser APIs (the `fetch` implementation is injectable),
 * so it can be exercised from Node against the fixtures in `public/test`.
 */

export type SpecFormat = 'json' | 'yaml';

export interface BundledSpec {
    document: unknown;
    format: SpecFormat;
}

/** Minimal subset of `Response` that the bundler needs — keeps the module testable. */
export interface FetchResponseLike {
    ok: boolean;
    status: number;
    text: () => Promise<string>;
}

export type FetchLike = (url: string) => Promise<FetchResponseLike>;

export const formatOf = (url: string): SpecFormat =>
    url.split(/[?#]/)[0].toLowerCase().endsWith('.json') ? 'json' : 'yaml';

export const parseSpec = (text: string, url: string): unknown => {
    if (formatOf(url) === 'json') {
        return JSON.parse(text);
    }
    const parsed = yaml.load(text);
    if (parsed === undefined) {
        throw new Error(`Не удалось разобрать ${url}`);
    }
    return parsed;
};

export const serializeSpec = (document: unknown, format: SpecFormat): string =>
    format === 'json'
        ? `${JSON.stringify(document, null, 2)}\n`
        // `noRefs` prevents js-yaml from emitting YAML anchors/aliases for repeated objects.
        : yaml.dump(document, { noRefs: true, lineWidth: -1 });

export const resolveJsonPointer = (document: unknown, pointer: string): unknown => {
    if (pointer === '') {
        return document;
    }
    return pointer
        .replace(/^\//, '')
        .split('/')
        .reduce<unknown>((current, segment) => {
            const key = segment.replace(/~1/g, '/').replace(/~0/g, '~');
            if (typeof current !== 'object' || current === null) {
                throw new Error(`Указатель ${pointer} не найден`);
            }
            return (current as Record<string, unknown>)[key];
        }, document);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * @param rootUrl absolute URL of the root spec
 * @param fetchFn injectable fetch, defaults to the global one (a browser or Node 18+ global)
 */
export const bundleSpec = async (rootUrl: string, fetchFn: FetchLike = fetch): Promise<BundledSpec> => {
    const loaded = new Map<string, unknown>();

    const load = async (url: string): Promise<unknown> => {
        if (loaded.has(url)) {
            return loaded.get(url);
        }
        const response = await fetchFn(url);
        if (!response.ok) {
            throw new Error(`Не удалось загрузить ${url}: ${response.status}`);
        }
        const document = parseSpec(await response.text(), url);
        loaded.set(url, document);
        return document;
    };

    const resolveNode = async (node: unknown, baseUrl: string, stack: readonly string[]): Promise<unknown> => {
        if (Array.isArray(node)) {
            return Promise.all(node.map((item) => resolveNode(item, baseUrl, stack)));
        }
        if (!isRecord(node)) {
            return node;
        }

        const ref = node.$ref;
        if (typeof ref === 'string' && !ref.startsWith('#')) {
            const target = new URL(ref, baseUrl);
            const pointer = target.hash ? decodeURIComponent(target.hash.slice(1)) : '';
            target.hash = '';
            const absolute = target.toString();
            const key = `${absolute}#${pointer}`;

            // A cyclic reference cannot be inlined — keep it as is instead of looping forever.
            if (stack.includes(key)) {
                return { $ref: ref };
            }

            const targetDocument = await load(absolute);
            const targetNode = resolveJsonPointer(targetDocument, pointer);
            return resolveNode(targetNode, absolute, [...stack, key]);
        }

        const entries = await Promise.all(
            Object.entries(node).map(async ([key, value]) => [key, await resolveNode(value, baseUrl, stack)] as const)
        );
        return Object.fromEntries(entries);
    };

    const document = await resolveNode(await load(rootUrl), rootUrl, []);
    return { document, format: formatOf(rootUrl) };
};
