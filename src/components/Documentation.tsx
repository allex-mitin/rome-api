import  {FC} from "react";
import {useLoaderData, useParams} from "react-router-dom";
import {SwaggerPage} from "../pages/SwaggerPage";
import {AsyncApiPage} from "../pages/AsyncApiPage";
import styled from "styled-components";
import {getSpecification} from "../helpers";
import {DocumentationType} from "../models/DocumentationType";

const DocumentationWrapper = styled.div`
    display: flex;
    overflow: auto;
    height: 100%;
    width: 100%;
`

export const Documentation: FC = () => {
    const params = useParams();
    const service = useLoaderData() as Service

    const specification = getSpecification(service, params.documentation, params.version)

    const document = (() => {
        switch (specification?.type()) {
            case DocumentationType.OPENAPI:
                return (<SwaggerPage url={specification?.currentUrl()?.url} />)
            case DocumentationType.ASYNCAPI:
                return (<AsyncApiPage url={specification?.currentUrl()?.url} />)
            default:
                return (<div><p>Documentation is not available</p></div>)
        }
    })()
    return(<DocumentationWrapper>{document}</DocumentationWrapper>)
}

