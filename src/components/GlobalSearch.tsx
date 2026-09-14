import { FC, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { SearchIcon } from "./icons";
import { Services } from "../helpers";
import { buildSearchIndex } from "../helpers/specIndex";
import type { SearchEntry } from "../helpers/specIndex";

interface GlobalSearchProps {
    className?: string;
}

const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 30;

const KIND_LABEL: Record<SearchEntry['kind'], string> = {
    operation: 'операция',
    schema: 'схема',
    message: 'сообщение',
    channel: 'канал',
};

const Wrapper = styled.div`
    position: relative;
    flex: 0 1 420px;
    min-width: 160px;
`

// Named differently from the imported glyph so the two do not collide in this file.
const SearchGlyph = styled(SearchIcon)`
    position: absolute;
    top: 50%;
    left: 12px;
    width: 18px;
    height: 18px;
    transform: translateY(-50%);
    color: #98a2b3;
    pointer-events: none;
`

const SearchInput = styled.input`
    width: 100%;
    box-sizing: border-box;
    height: 40px;
    padding: 0 14px 0 38px;
    border: 1px solid transparent;
    border-radius: 10px;
    background: #f2f4f7;
    font: inherit;
    font-size: 14px;
    color: #101828;
    transition: background 120ms ease, border-color 120ms ease, box-shadow 120ms ease;

    &::placeholder {
        color: #98a2b3;
    }

    &:hover {
        background: #eaecf0;
    }

    // The accent colour arrives as a CSS variable from the branding settings, so a palette colour is
    // mixed into the ring instead of picking a matching alpha by hand.
    &:focus {
        outline: none;
        background: #fff;
        border-color: var(--app-accent);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--app-accent) 22%, transparent);
    }
`

const Dropdown = styled.div`
    position: absolute;
    z-index: 20;
    top: 46px;
    left: 0;
    right: 0;
    max-height: 420px;
    overflow: auto;
    background: #fff;
    border: 1px solid #e4e7ec;
    border-radius: 10px;
    box-shadow: 0 12px 28px rgba(16, 24, 40, 0.14);
`

const Status = styled.div`
    padding: 10px 12px;
    color: #475467;
    font-size: 13px;
`

const ResultButton = styled.button`
    display: block;
    width: 100%;
    padding: 8px 12px;
    border: 0;
    border-top: 1px solid #f2f4f7;
    background: transparent;
    text-align: left;
    cursor: pointer;
    font: inherit;

    &:first-of-type {
        border-top: 0;
    }

    &:hover {
        background: color-mix(in srgb, var(--app-accent) 8%, #fff);
    }
`

const ResultTitle = styled.div`
    font-size: 14px;
    color: #101828;
`

const ResultMeta = styled.div`
    font-size: 12px;
    color: #475467;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`

export const GlobalSearch: FC<GlobalSearchProps> = ({ className }) => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [entries, setEntries] = useState<SearchEntry[] | null>(null);
    const [skipped, setSkipped] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    // Guards against re-indexing after a failure on every focus.
    const failed = useRef(false);

    const ensureIndex = async () => {
        if (entries !== null || loading || failed.current) {
            return;
        }
        setLoading(true);
        setOpen(true);
        try {
            const index = await buildSearchIndex(await Services());
            setEntries(index.entries);
            setSkipped(index.skipped);
        } catch {
            failed.current = true;
            setEntries([]);
        } finally {
            setLoading(false);
        }
    };

    const needle = query.trim().toLowerCase();

    const results = useMemo(() => {
        if (!entries || needle.length < MIN_QUERY_LENGTH) {
            return [];
        }
        return entries
            .filter((entry) => `${entry.title} ${entry.detail} ${entry.serviceName}`.toLowerCase().includes(needle))
            .slice(0, MAX_RESULTS);
    }, [entries, needle]);

    const handleSelect = (entry: SearchEntry) => {
        setQuery('');
        setOpen(false);
        navigate(`/service/${ entry.service }/${ entry.documentation }${ entry.anchor ?? '' }`, {
            // A fresh token makes `SwaggerPage` remount swagger-ui, so the anchor takes effect even when
            // the page is already open: react-router updates the hash through `pushState`, which does not
            // fire `hashchange`, and swagger-ui reads the hash only while initialising.
            state: { jumpToken: Date.now() },
        });
    };

    const hint = (() => {
        if (loading) {
            return 'Индексирую спецификации…';
        }
        if (!entries) {
            return null;
        }
        if (entries.length === 0) {
            return 'Не удалось построить индекс';
        }
        if (needle.length < MIN_QUERY_LENGTH) {
            return `Введите минимум ${MIN_QUERY_LENGTH} символа`;
        }
        return results.length === 0 ? 'Ничего не найдено' : null;
    })();

    return (
        <Wrapper className={ className }>
            <SearchGlyph/>
            <SearchInput
                type="search"
                value={ query }
                placeholder="Поиск по всем спекам…"
                aria-label="Поиск по всем спецификациям"
                onChange={ (event) => {
                    setQuery(event.target.value);
                    setOpen(true);
                } }
                onFocus={ () => {
                    setOpen(true);
                    void ensureIndex();
                } }
                // `onMouseDown` on the results fires before this blur closes the dropdown.
                onBlur={ () => window.setTimeout(() => setOpen(false), 150) }
                onKeyDown={ (event) => {
                    if (event.key === 'Escape') {
                        setOpen(false);
                    }
                } }
            />
            { open && entries !== null && (
                <Dropdown>
                    { hint && <Status>{ hint }</Status> }
                    { !loading && results.map((entry) => (
                        <ResultButton
                            key={ `${ entry.service }-${ entry.documentation }-${ entry.kind }-${ entry.detail }` }
                            type="button"
                            onMouseDown={ () => handleSelect(entry) }
                        >
                            <ResultTitle>{ entry.title }</ResultTitle>
                            <ResultMeta>
                                { entry.serviceName } · { KIND_LABEL[entry.kind] } · { entry.detail }
                            </ResultMeta>
                        </ResultButton>
                    )) }
                    { hint === null && skipped.length > 0 && (
                        <Status>Не проиндексированы: { skipped.join(', ') }</Status>
                    ) }
                </Dropdown>
            ) }
        </Wrapper>
    );
};
