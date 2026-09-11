import { parseSpec, type FetchLike } from './specBundler';
import type { Service, Spec } from '../types';

/**
 * Builds a flat, searchable index over the services listed in the settings.
 *
 * Only the *default* spec URL of each service is indexed, not every version: versions of the same
 * service are nearly identical, and indexing all of them would multiply the number of fetches.
 *
 * The module is free of browser APIs (fetch and the base URL are injectable), so the extraction
 * can be exercised from Node against the fixtures in `public/test`.
 */

export type SearchEntryKind = 'operation' | 'schema' | 'message' | 'channel';

export interface SearchEntry {
    service: string;
    serviceName: string;
    documentation: 'openapi' | 'asyncapi';
    kind: SearchEntryKind;
    /** What the user sees first. */
    title: string;
    /** Where the entry lives, e.g. `GET /pet/{petId}` or `components.schemas.Pet`. */
    detail: string;
    /** Hash to append to the route, e.g. `#/pet/getPetById`. Absent when the renderer cannot deep-link. */
    anchor?: string;
}

interface EntryMeta {
    service: string;
    serviceName: string;
    documentation: 'openapi' | 'asyncapi';
}

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const asText = (value: unknown): string | undefined =>
    typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;

const namedEntries = (
    container: unknown,
    kind: SearchEntryKind,
    location: string,
    meta: EntryMeta
): SearchEntry[] => {
    if (!isRecord(container)) {
        return [];
    }
    return Object.entries(container).map(([name, value]) => ({
        ...meta,
        kind,
        title: (isRecord(value) ? asText(value.title) ?? asText(value.summary) : undefined) ?? name,
        detail: `${location}.${name}`,
    }));
};

/**
 * swagger-ui puts operations in the URL as `#/<tag>/<operationId>` (deep-linking plugin,
 * `urlHashArrayFromIsShownKey`) and url-encodes both parts itself. The tag falls back to `default`
 * (swagger-ui's `DEFAULT_TAG`). An explicit `operationId` is required: without it swagger-ui
 * synthesises an id and we cannot know which one.
 */
const operationAnchor = (operation: Record<string, unknown>): string | undefined => {
    const operationId = asText(operation.operationId);
    if (!operationId) {
        return undefined;
    }
    const tag = (Array.isArray(operation.tags) ? asText(operation.tags[0]) : undefined) ?? 'default';
    return `#/${encodeURIComponent(tag)}/${encodeURIComponent(operationId)}`;
};

export const indexOpenApiDocument = (document: unknown, meta: EntryMeta): SearchEntry[] => {
    if (!isRecord(document)) {
        return [];
    }
    const entries: SearchEntry[] = [];

    if (isRecord(document.paths)) {
        for (const [path, item] of Object.entries(document.paths)) {
            if (!isRecord(item)) {
                continue;
            }
            for (const method of HTTP_METHODS) {
                const operation = item[method];
                if (!isRecord(operation)) {
                    continue;
                }
                const call = `${method.toUpperCase()} ${path}`;
                entries.push({
                    ...meta,
                    kind: 'operation',
                    title: asText(operation.summary) ?? asText(operation.operationId) ?? call,
                    detail: call,
                    anchor: operationAnchor(operation),
                });
            }
        }
    }

    // Swagger 2.0 keeps schemas under `definitions`, OpenAPI 3.x under `components.schemas`.
    const components = isRecord(document.components) ? document.components : undefined;
    const schemas = isRecord(document.definitions)
        ? document.definitions
        : components && isRecord(components.schemas)
            ? components.schemas
            : undefined;
    entries.push(...namedEntries(schemas, 'schema', 'schemas', meta));

    return entries;
};

export const indexAsyncApiDocument = (document: unknown, meta: EntryMeta): SearchEntry[] => {
    if (!isRecord(document)) {
        return [];
    }
    const entries: SearchEntry[] = [];

    if (isRecord(document.channels)) {
        for (const [key, channel] of Object.entries(document.channels)) {
            const address = isRecord(channel) ? asText(channel.address) : undefined;
            entries.push({
                ...meta,
                kind: 'channel',
                title: asText(isRecord(channel) ? channel.description : undefined) ?? address ?? key,
                detail: `channels.${key}${address ? ` (${address})` : ''}`,
            });
        }
    }

    if (isRecord(document.operations)) {
        for (const [key, operation] of Object.entries(document.operations)) {
            const action = isRecord(operation) ? asText(operation.action) : undefined;
            entries.push({
                ...meta,
                kind: 'operation',
                title: asText(isRecord(operation) ? operation.summary : undefined) ?? key,
                detail: `operations.${key}${action ? ` (${action})` : ''}`,
            });
        }
    }

    const components = isRecord(document.components) ? document.components : undefined;
    entries.push(...namedEntries(components?.messages, 'message', 'components.messages', meta));
    entries.push(...namedEntries(components?.schemas, 'schema', 'components.schemas', meta));

    return entries;
};

export const defaultSpecUrl = (spec: Spec | undefined): string | undefined => {
    if (!spec) {
        return undefined;
    }
    if (spec.url) {
        return spec.url;
    }
    const [first] = Object.values(spec.urls ?? {});
    return first;
};

/** A failing service must not break the whole index, so its error is returned instead of thrown. */
export const buildSearchIndex = async (
    services: Service[],
    fetchFn: FetchLike = fetch,
    baseUrl: string = window.location.origin
): Promise<{ entries: SearchEntry[]; skipped: string[] }> => {
    const entries: SearchEntry[] = [];
    const skipped: string[] = [];

    const load = async (service: Service, documentation: 'openapi' | 'asyncapi', url: string) => {
        const meta: EntryMeta = { service: service.path, serviceName: service.name, documentation };
        try {
            const response = await fetchFn(new URL(url, baseUrl).toString());
            if (!response.ok) {
                throw new Error(String(response.status));
            }
            const document = parseSpec(await response.text(), url);
            entries.push(
                ...(documentation === 'openapi'
                    ? indexOpenApiDocument(document, meta)
                    : indexAsyncApiDocument(document, meta))
            );
        } catch {
            skipped.push(`${service.name} (${documentation})`);
        }
    };

    for (const service of services) {
        const openApiUrl = defaultSpecUrl(service.openapi);
        if (openApiUrl) {
            await load(service, 'openapi', openApiUrl);
        }
        const asyncApiUrl = defaultSpecUrl(service.asyncapi);
        if (asyncApiUrl) {
            await load(service, 'asyncapi', asyncApiUrl);
        }
    }

    return { entries, skipped };
};
