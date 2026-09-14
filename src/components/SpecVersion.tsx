import { FC, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useLoaderData, useNavigate, useParams } from "react-router-dom";
import { ChevronDownIcon } from "./icons";
import { getSpecification } from "../helpers";
import type { Service } from "../types";

const Wrapper = styled.div`
    position: relative;
    flex: 0 0 auto;
`

// A chip, not a form field: in a toolbar a bordered `select` reads as an input and fights with the
// spec switch next to it.
const Trigger = styled.button<{ $open: boolean }>`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 32px;
    padding: 0 6px 0 12px;
    border: 0;
    border-radius: 9px;
    background: ${({ $open }) => $open ? 'rgba(16, 24, 40, 0.09)' : 'var(--app-hover)'};
    color: var(--app-text);
    font: inherit;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 120ms ease;

    &:hover {
        background: rgba(16, 24, 40, 0.09);
    }

    &:focus-visible {
        outline: 2px solid var(--app-accent);
        outline-offset: 1px;
    }
`

const Chevron = styled(ChevronDownIcon)<{ $open: boolean }>`
    width: 16px;
    height: 16px;
    color: var(--app-text-muted);
    transform: rotate(${({ $open }) => $open ? 180 : 0}deg);
    transition: transform 140ms ease;
`

const List = styled.div`
    position: absolute;
    top: 38px;
    right: 0;
    z-index: 20;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 100%;
    max-height: 260px;
    overflow-y: auto;
    padding: 4px;
    background: var(--app-surface);
    border-radius: 10px;
    box-shadow: 0 12px 28px rgba(16, 24, 40, 0.16), 0 0 0 1px rgba(16, 24, 40, 0.06);
`

const Item = styled.button<{ $selected: boolean }>`
    display: block;
    width: 100%;
    padding: 7px 10px;
    border: 0;
    border-radius: 7px;
    background: ${({ $selected }) => $selected
        ? 'color-mix(in srgb, var(--app-accent) 14%, #fff)'
        : 'transparent'};
    color: var(--app-text);
    font: inherit;
    font-size: 13px;
    font-weight: ${({ $selected }) => $selected ? 550 : 400};
    text-align: left;
    white-space: nowrap;
    cursor: pointer;

    &:hover {
        background: ${({ $selected }) => $selected
        ? 'color-mix(in srgb, var(--app-accent) 20%, #fff)'
        : 'var(--app-hover)'};
    }

    &:focus-visible {
        outline: 2px solid var(--app-accent);
        outline-offset: -2px;
    }
`

export const SpecVersion: FC = () => {
    const params = useParams()
    const service = useLoaderData() as Service
    const navigate = useNavigate()

    const [open, setOpen] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)

    const specification = getSpecification(service, params.documentation, params.version)
    const hasVersions = Boolean(specification?.spec()?.urls)

    // Closing on an outside press is what makes the popover feel like a menu rather than a field that
    // stayed open: `mousedown` fires before the click that would select an option.
    useEffect(() => {
        if (!open) {
            return
        }
        const handlePointerDown = (event: MouseEvent) => {
            if (!wrapperRef.current?.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handlePointerDown)
        return () => document.removeEventListener('mousedown', handlePointerDown)
    }, [open])

    // Focus lands on the current version, so the keyboard continues from where the eye is.
    useEffect(() => {
        if (open) {
            wrapperRef.current?.querySelector<HTMLButtonElement>('[data-selected="true"]')?.focus()
        }
    }, [open])

    if (!hasVersions) {
        return null;
    }

    const versions = Array.from(specification?.urls().entries() ?? [])
    const current = specification?.currentUrl()?.version ?? specification?.defaultUrl()?.version

    // Only the version itself is shown: the chip sits right next to the service name and already has a
    // chevron, so the wording was noise. The total is kept in the tooltip and the accessible name.
    const versionHint = current === undefined
        ? 'Выбрать версию спецификации'
        : versions.length > 1
            ? `Версия ${ current } из ${ versions.length }`
            : `Версия ${ current }`

    const select = (version: string) => {
        setOpen(false)
        if (version !== current) {
            navigate(`/service/${ params.serviceName }/${ params.documentation }/${ version }`)
        }
    }

    return (
        <Wrapper
            ref={ wrapperRef }
            onKeyDown={ (event) => {
                if (event.key === 'Escape') {
                    setOpen(false)
                    triggerRef.current?.focus()
                }
            } }
        >
            <Trigger
                ref={ triggerRef }
                type="button"
                $open={ open }
                aria-haspopup="listbox"
                aria-expanded={ open }
                aria-label={ versionHint }
                title={ versionHint }
                onClick={ () => setOpen((value) => !value) }
                onKeyDown={ (event) => {
                    if (event.key === 'ArrowDown') {
                        event.preventDefault()
                        setOpen(true)
                    }
                } }
            >
                { current }
                <Chevron $open={ open }/>
            </Trigger>

            { open && (
                <List
                    role="listbox"
                    // Arrow keys walk the options like a real select does.
                    onKeyDown={ (event) => {
                        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
                            return
                        }
                        event.preventDefault()
                        const items = Array.from(wrapperRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? [])
                        const index = items.indexOf(document.activeElement as HTMLButtonElement)
                        const next = event.key === 'ArrowDown' ? index + 1 : index - 1
                        items[(next + items.length) % items.length]?.focus()
                    } }
                >
                    { versions.map(([version]) => (
                        <Item
                            key={ version }
                            type="button"
                            role="option"
                            aria-selected={ version === current }
                            data-selected={ version === current }
                            $selected={ version === current }
                            onClick={ () => select(version) }
                        >
                            { version }
                        </Item>
                    )) }
                </List>
            ) }
        </Wrapper>
    )
};
