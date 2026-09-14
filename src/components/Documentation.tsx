import { FC, lazy, Suspense } from "react";
import { useLoaderData, useParams } from "react-router-dom";
import styled from "styled-components";
import { Spinner } from "./Spinner";
import { getSpecification } from "../helpers";
import { asyncApiOptions, openApiOptions } from "../helpers/rendererOptions";
import { DocumentationType } from "../models/DocumentationType";
import { LoadingSpec } from "./LoadingSpec";
import type { Service } from "../types";

// The OpenAPI (swagger-ui) and AsyncAPI (asyncapi react component) renderers are heavy.
// Loading them lazily keeps both out of the initial bundle: only the renderer required by
// the current route is downloaded.
const SwaggerPage = lazy(() => import("../pages/SwaggerPage").then(module => ({ default: module.SwaggerPage })))
const AsyncApiPage = lazy(() => import("../pages/AsyncApiPage").then(module => ({ default: module.AsyncApiPage })))

// No scrolling here: the route container (`Service`) scrolls, so the toolbar can stick to its top.
const DocumentationWrapper = styled.div`
    display: flex;
    flex: 1;
    min-height: 0;
    min-width: 0;
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
                // `swagger-ui-react` reads its options once, while building the system on mount
                // (`useEffect(..., [])` in its source), and has no way to update them afterwards.
                // Client-side navigation from one service to another is an update, not a remount, so the
                // key forces a fresh renderer whenever the document changes — otherwise the options of
                // the previously opened service would stick.
                return (
                    <SwaggerPage
                        key={ specification?.currentUrl()?.url ?? 'openapi' }
                        url={ specification?.currentUrl()?.url }
                        options={ openApiOptions(service) }
                    />
                )
            case DocumentationType.ASYNCAPI:
                return (<AsyncApiPage url={ specification?.currentUrl()?.url } options={ asyncApiOptions(service) } />)
            default:
                // Reached when the URL names a documentation type the service does not have —
                // the same message the renderers show when they are given no address at all.
                return (<LoadingSpec withError/>)
        }
    })()
    return (
        <DocumentationWrapper>
            <Suspense fallback={ <FallbackWrapper><Spinner size="xl"/></FallbackWrapper> }>
                { document }
            </Suspense>
        </DocumentationWrapper>
    )
}
