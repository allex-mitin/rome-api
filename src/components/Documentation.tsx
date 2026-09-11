import { FC, lazy, Suspense } from "react";
import { useLoaderData, useParams } from "react-router-dom";
import styled from "styled-components";
import { Spinner } from "@admiral-ds/react-ui";
import { getSpecification } from "../helpers";
import { DocumentationType } from "../models/DocumentationType";
import type { Service } from "../types";

// The OpenAPI (swagger-ui) and AsyncAPI (asyncapi react component) renderers are heavy.
// Loading them lazily keeps both out of the initial bundle: only the renderer required by
// the current route is downloaded.
const SwaggerPage = lazy(() => import("../pages/SwaggerPage").then(module => ({ default: module.SwaggerPage })))
const AsyncApiPage = lazy(() => import("../pages/AsyncApiPage").then(module => ({ default: module.AsyncApiPage })))

const DocumentationWrapper = styled.div`
    display: flex;
    overflow: auto;
    height: 100%;
`

const FallbackWrapper = styled.div`
    display: flex;
    width: 100%;
    justify-content: center;
    align-items: center;
`

export const Documentation: FC = () => {
    const params = useParams();
    const service = useLoaderData() as Service

    const specification = getSpecification(service, params.documentation, params.version)

    const document = (() => {
        switch (specification?.type()) {
            case DocumentationType.OPENAPI:
                return (<SwaggerPage url={ specification?.currentUrl()?.url } />)
            case DocumentationType.ASYNCAPI:
                return (<AsyncApiPage url={ specification?.currentUrl()?.url } />)
            default:
                return (<div><p>Documentation is not available</p></div>)
        }
    })()
    return (
        <DocumentationWrapper>
            <Suspense fallback={ <FallbackWrapper><Spinner dimension="xl"/></FallbackWrapper> }>
                { document }
            </Suspense>
        </DocumentationWrapper>
    )
}
