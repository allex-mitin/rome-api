import { FC } from 'react';
import { Header } from './Header';
import { Navigator } from "./Navigator";
import { Outlet } from "react-router";
import styled from "styled-components";

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
    return (
        <LayoutWrapper>
            <Header/>
            <LayoutBodyWrapper>
                <Navigator/>
                <Outlet/>
            </LayoutBodyWrapper>
        </LayoutWrapper>
    )
};
