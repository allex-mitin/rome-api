import React, { FC } from 'react';
import {NavLink, useLoaderData, useNavigate, useParams} from 'react-router-dom';
import styled from "styled-components";
import { ContentSwitcher, ContentSwitcherItem } from "@admiral-ds/react-ui";
import { getService, Services } from "../helpers";


const SpecToggleWrapper = styled.div`
    //margin-right: auto;
    //padding-right: 30px;
`


export const SpecToggle: FC = () => {
    const navigate = useNavigate()
    const service = useLoaderData() as Service
    const { documentation } = useParams()

    const items = []
    if(service?.openapi) items.push({ id: 'openapi', title: 'OpenAPI'})
    if(service?.asyncapi) items.push({ id: 'asyncapi', title: 'AsyncAPI'})

    if(items.length === 0){
        return null;
    }

    const handleToggleClick = (tabId: string) => {
        navigate(`/service/${service.path}/${tabId}`)
    }


    return (
        <SpecToggleWrapper>
            <ContentSwitcher dimension={ 'm' }>
                { items.map((item) => (
                    <ContentSwitcherItem
                        key={ item.id }
                        active={ item.id === documentation }
                        onClick={ () => handleToggleClick(item.id) }
                    >
                        { item.title }
                    </ContentSwitcherItem>
                )) }
            </ContentSwitcher>
        </SpecToggleWrapper>
    )
};
