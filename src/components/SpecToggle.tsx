import { FC } from 'react';
import { useLoaderData, useNavigate, useParams } from 'react-router-dom';
import styled from "styled-components";
import type { Service } from "../types";

// A segmented control of our own: the one from the previous design system cannot be restyled without
// fighting its generated class names, and every other control in the shell (sidebar pills, version
// chip, search field) already follows one local language.
const Track = styled.div`
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 2px;
    padding: 3px;
    border-radius: 10px;
    background: var(--app-hover);
`

const Segment = styled.button<{ $active: boolean; $interactive: boolean }>`
    display: inline-flex;
    align-items: center;
    height: 28px;
    padding: 0 12px;
    border: 0;
    border-radius: 8px;
    background: ${({ $active }) => $active ? 'var(--app-surface)' : 'transparent'};
    // The active segment is a raised thumb with the brand colour on it; the inactive one is quiet.
    box-shadow: ${({ $active }) => $active ? '0 1px 2px rgba(16, 24, 40, 0.10)' : 'none'};
    color: ${({ $active }) => $active ? 'var(--app-accent)' : 'var(--app-text-muted)'};
    font: inherit;
    font-size: 13px;
    font-weight: ${({ $active }) => $active ? 550 : 500};
    line-height: 1;
    white-space: nowrap;
    cursor: ${({ $interactive }) => $interactive ? 'pointer' : 'default'};
    transition: background 120ms ease, color 120ms ease;

    &:hover {
        background: ${({ $active, $interactive }) => $active
        ? 'var(--app-surface)'
        : $interactive ? 'rgba(16, 24, 40, 0.05)' : 'transparent'};
        color: ${({ $active, $interactive }) => $active
        ? 'var(--app-accent)'
        : $interactive ? 'var(--app-text)' : 'var(--app-text-muted)'};
    }

    &:focus-visible {
        outline: 2px solid var(--app-accent);
        outline-offset: 1px;
    }
`

export const SpecToggle: FC = () => {
    const navigate = useNavigate()
    const service = useLoaderData() as Service
    const { documentation } = useParams()

    const items: { id: string; title: string }[] = []
    if (service?.openapi) items.push({ id: 'openapi', title: 'OpenAPI' })
    if (service?.asyncapi) items.push({ id: 'asyncapi', title: 'AsyncAPI' })

    if (items.length === 0) {
        return null;
    }

    // With a single spec there is nothing to switch: the segment becomes a label for what is open.
    const interactive = items.length > 1

    const handleToggleClick = (tabId: string) => {
        if (interactive) {
            navigate(`/service/${ service.path }/${ tabId }`)
        }
    }

    return (
        <Track role="group" aria-label="Тип документации">
            { items.map((item) => (
                <Segment
                    key={ item.id }
                    type="button"
                    $active={ item.id === documentation }
                    $interactive={ interactive }
                    aria-pressed={ item.id === documentation }
                    onClick={ () => handleToggleClick(item.id) }
                >
                    { item.title }
                </Segment>
            )) }
        </Track>
    )
};
