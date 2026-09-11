import { FC, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { SystemSearchOutline } from '@admiral-ds/icons';
import { Services } from '../helpers';
import type { Service } from '../types';

// The sidebar is separated from the spec by whitespace only — no tinted panel and no divider.
const NavigatorWrapper = styled.div`
    box-sizing: border-box;
    display: flex;
    flex: 0 0 268px;
    flex-direction: column;
    gap: 10px;
    min-height: 0;
    padding: 18px 10px 18px 20px;

    @media (max-width: 1100px) {
        flex-basis: 220px;
        padding-left: 16px;
    }
`

const SidebarHeader = styled.div`
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    padding: 0 4px;
`

const SidebarTitle = styled.div`
    color: var(--app-text-muted);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
`

const Counter = styled.div`
    color: var(--app-text-muted);
    font-size: 12px;
`

const FilterWrapper = styled.div`
    position: relative;
    flex: 0 0 auto;
`

const FilterIcon = styled(SystemSearchOutline)`
    position: absolute;
    top: 50%;
    left: 10px;
    width: 16px;
    height: 16px;
    transform: translateY(-50%);
    color: #98a2b3;
    pointer-events: none;
`

const FilterInput = styled.input`
    width: 100%;
    box-sizing: border-box;
    height: 34px;
    padding: 0 10px 0 32px;
    border: 0;
    border-radius: 10px;
    background: var(--app-hover);
    font: inherit;
    font-size: 13px;
    color: var(--app-text);
    transition: background 120ms ease, box-shadow 120ms ease;

    &::placeholder {
        color: #98a2b3;
    }

    &:hover {
        background: rgba(16, 24, 40, 0.075);
    }

    &:focus {
        outline: none;
        background: var(--app-surface);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--app-accent) 22%, transparent);
    }
`

// The service list can be long: it scrolls on its own, under a filter that stays in place.
const List = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-height: 0;
    overflow-y: auto;
    padding-right: 6px;
    padding-bottom: 4px;
`

const Item = styled.button<{ $selected: boolean }>`
    display: block;
    width: 100%;
    box-sizing: border-box;
    flex: 0 0 auto;
    padding: 8px 12px;
    border: 0;
    border-radius: 10px;
    background: ${({ $selected }) => $selected
        ? 'color-mix(in srgb, var(--app-accent) 14%, #fff)'
        : 'transparent'};
    box-shadow: ${({ $selected }) => $selected
        ? 'inset 0 0 0 1px color-mix(in srgb, var(--app-accent) 30%, transparent)'
        : 'none'};
    color: var(--app-text);
    font: inherit;
    font-size: 14px;
    font-weight: ${({ $selected }) => $selected ? 550 : 400};
    line-height: 20px;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
    transition: background 120ms ease;

    &:hover {
        background: ${({ $selected }) => $selected
        ? 'color-mix(in srgb, var(--app-accent) 20%, #fff)'
        : 'var(--app-hover)'};
    }

    &:focus-visible {
        outline: 2px solid var(--app-accent);
        outline-offset: 1px;
    }
`

const Empty = styled.div`
    padding: 10px 12px;
    color: var(--app-text-muted);
    font-size: 13px;
`

export const Navigator: FC = () => {
    const navigate = useNavigate();
    const { serviceName } = useParams();

    const [services, setServices] = useState<Service[]>([])
    const [query, setQuery] = useState('')

    useEffect(() => {
        Services().then(setServices)
    }, []);

    const needle = query.trim().toLowerCase()
    const visible = useMemo(
        () => needle === ''
            ? services
            : services.filter((service) => service.name.toLowerCase().includes(needle)),
        [services, needle],
    )

    return (
        <NavigatorWrapper>
            <SidebarHeader>
                <SidebarTitle>Сервисы</SidebarTitle>
                <Counter>{ needle === '' ? services.length : `${ visible.length } / ${ services.length }` }</Counter>
            </SidebarHeader>

            <FilterWrapper>
                <FilterIcon/>
                <FilterInput
                    type="search"
                    value={ query }
                    placeholder="Фильтр по названию"
                    aria-label="Фильтр по названию сервиса"
                    onChange={ (event) => setQuery(event.target.value) }
                    onKeyDown={ (event) => {
                        if (event.key === 'Escape') {
                            setQuery('')
                        }
                    } }
                />
            </FilterWrapper>

            <List>
                { visible.map((service) => (
                    <Item
                        key={ service.path }
                        type="button"
                        $selected={ service.path === serviceName }
                        // The name is truncated in the rail, so the full one stays reachable.
                        title={ service.name }
                        onClick={ () => navigate(`/service/${ service.path }`) }
                    >
                        { service.name }
                    </Item>
                )) }
                { visible.length === 0 && (
                    <Empty>{ services.length === 0 ? 'Сервисы не настроены' : 'Ничего не найдено' }</Empty>
                ) }
            </List>
        </NavigatorWrapper>
    );
}
