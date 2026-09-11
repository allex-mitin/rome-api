import { FC } from 'react';
import styled from "styled-components";
import { SpecToggle } from "./SpecToggle";
import { SpecVersion } from "./SpecVersion";
import { useLoaderData } from "react-router-dom";
import { NavBarButtons } from "./NavBarButtons";
import type { Service } from "../types";

const NavigatorWrapper = styled.div`
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    gap: 10px;
    overflow: hidden;
    align-items: center;
`
const ServiceName = styled.div`
    width: auto;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: bold;
`


export const NavBar: FC = () => {
    const service = useLoaderData() as Service

    return (
        <NavigatorWrapper>
            <SpecToggle/>
            <SpecVersion />
            <ServiceName>{service.name}</ServiceName>
            <NavBarButtons />
        </NavigatorWrapper>
    );
}
