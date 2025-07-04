import {FC} from "react";
import {Outlet} from "react-router";
import styled from "styled-components";
import {NavBar} from "./NavBar";
import {Divider} from "@admiral-ds/react-ui";


const ServiceWrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: calc(100vw - 300px);
`
export const Service: FC = () => {
    return (
        <ServiceWrapper>
            <NavBar/>
            <Divider/>
            <Outlet/>
        </ServiceWrapper>
    )
}
