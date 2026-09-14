import { FC } from "react";
import styled from "styled-components";
import { SpecToggle } from "./SpecToggle";
import { SpecVersion } from "./SpecVersion";
import { useLoaderData } from "react-router-dom";
import { NavBarButtons } from "./NavBarButtons";
import type { Service } from "../types";

// An opaque strip that stays put while the spec scrolls under it: the content simply disappears
// behind it — no divider and no shadow, both of which read as a stripe.
const NavigatorWrapper = styled.div`
    box-sizing: border-box;
    position: sticky;
    top: 0;
    // Above the renderers: the AsyncAPI theme is Tailwind-based and stacks its panels with z-10
    // (relative z-10 on its panel--center), so a small value here would let the spec paint over the
    // bar. 50 is the top of Tailwind's own scale, which is what those stylesheets use.
    z-index: 50;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    gap: 12px;
    align-items: center;
    flex: 0 0 auto;
    padding: 12px var(--app-gutter);
    background: var(--app-surface);
`

// The service name and the controls that describe it (which spec, which version) sit together on
// the left: that grouping is what makes it visible that a service can have several specs and versions.
// Only the actions — download, copy, refresh — stay on the right.
const ServiceName = styled.div`
    flex: 0 1 auto;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 15px;
    font-weight: 550;
    color: var(--app-text);
`

// Takes the free space between the description and the actions, so the actions stay pinned right.
const Spacer = styled.div`
    flex: 1 1 auto;
`

export const NavBar: FC = () => {
    const service = useLoaderData() as Service

    return (
        <NavigatorWrapper>
            <ServiceName title={ service.name }>{ service.name }</ServiceName>
            <SpecToggle/>
            <SpecVersion/>
            <Spacer/>
            <NavBarButtons/>
        </NavigatorWrapper>
    );
}
