import { FC } from 'react';
import styled from "styled-components";
import { SpecToggle } from "./SpecToggle";
import { SpecVersion } from "./SpecVersion";
import { useLoaderData } from "react-router-dom";
import { NavBarButtons } from "./NavBarButtons";
import type { Service } from "../types";

// A translucent strip that stays put while the spec scrolls under it. The controls are the only
// thing that stays visible: the surface is nearly transparent and there is no divider under it,
// so the blurred content behind does the separating.
const NavigatorWrapper = styled.div`
    box-sizing: border-box;
    position: sticky;
    top: 0;
    z-index: 4;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    gap: 12px;
    align-items: center;
    flex: 0 0 auto;
    padding: 12px var(--app-gutter);
    background: color-mix(in srgb, var(--app-surface) 80%, transparent);
    backdrop-filter: blur(12px);
`

// The service name is context, not the headline: the spec below renders its own title.
const ServiceName = styled.div`
    flex: 1 1 auto;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--app-text-muted);
    font-size: 13px;
`

export const NavBar: FC = () => {
    const service = useLoaderData() as Service

    return (
        <NavigatorWrapper>
            <SpecToggle/>
            <SpecVersion />
            <ServiceName title={ service.name }>{ service.name }</ServiceName>
            <NavBarButtons />
        </NavigatorWrapper>
    );
}
