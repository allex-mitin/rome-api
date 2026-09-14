import {FC} from "react";
import {Outlet} from "react-router";
import styled from "styled-components";
import {NavBar} from "./NavBar";

// The spec is not wrapped in a card of its own: the page surface is white already, and the toolbar
// sticks to its top. This element is the only scroll container of the route — that is what makes
// the sticky toolbar work and keeps the spec flowing on the page.
const ServiceWrapper = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    min-height: 0;
    overflow: auto;
`
export const Service: FC = () => {
    return (
        <ServiceWrapper>
            <NavBar/>
            <Outlet/>
        </ServiceWrapper>
    )
}
