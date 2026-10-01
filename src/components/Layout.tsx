import { FC } from 'react';
import { Header } from './Header';
import { Navigator } from "./Navigator";
import { Outlet } from "react-router";
import styled from "styled-components";
import { getLoadedServices } from '../helpers';
import { isServiceListHidden } from '../helpers/ui';

const LayoutWrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100vh;
    background: var(--app-surface);
`;

// No gap and no padding between the sidebar and the content: they are separated by whitespace,
// which keeps the spec from being fenced off in a card of its own.
const LayoutBodyWrapper = styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    // Takes the rest of the viewport under the header: no magic header height to keep in sync.
    flex: 1;
    min-height: 0;
`;

export const Layout: FC = () => {
    // A single service makes the list redundant: it takes a fixed width off the spec and offers
    // nothing to choose. Whether it is dropped is decided by the settings file
    // (`ui.hideServiceListWhenSingle`), so every multi-service deployment keeps the current shell.
    const services = getLoadedServices()

    return (
        <LayoutWrapper>
            <Header/>
            <LayoutBodyWrapper>
                { !isServiceListHidden(services) && <Navigator/> }
                <Outlet/>
            </LayoutBodyWrapper>
        </LayoutWrapper>
    )
};
