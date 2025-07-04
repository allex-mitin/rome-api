import React, {FC} from 'react';
import styled from "styled-components";
import {SpecToggle} from "./SpecToggle";
import {SpecVersion} from "./SpecVersion";
import {Service} from "./Service";
import {useLoaderData} from "react-router-dom";
import {ButtonGroup} from "@admiral-ds/react-ui";
import {NavBarButtons} from "./NavBarButtons";

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
