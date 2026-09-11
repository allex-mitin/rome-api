import { FC } from 'react';
import { ThemeProvider } from 'styled-components';
import {
    createBrowserRouter,
    createRoutesFromElements,
    redirect,
    Route,
    type LoaderFunctionArgs
} from 'react-router-dom';
import { Layout } from "./Layout";
import { RouterProvider } from "react-router";
import { WelcomePage } from "../pages/WelcomePage";
import { ErrorPage } from "../pages/ErrorPage";
import { Service } from "./Service";
import { getService, hasAsyncApi, hasOpenApi } from "../helpers";
import { Documentation } from "./Documentation";
import { FontsVTBGroup, LIGHT_THEME } from '@admiral-ds/react-ui';


export const App: FC = () => {
    const routes = createRoutesFromElements([
        <Route key="root" path="/" element={ <Layout/> }>
            <Route index element={ <WelcomePage/> }/>
            <Route path="/home" element={ <WelcomePage/> }/>
            <Route path="/service/:serviceName" element={ <Service/> } loader={ serviceLoader } errorElement={ <ErrorPage/> }>
                <Route index element={ <Documentation/> } loader={ defaultDocumentation }/>
                <Route path=":documentation" element={ <Documentation /> } loader={ serviceLoader }>
                    <Route path=":version" element={ <Documentation /> } loader={ serviceLoader }/>
                </Route>
            </Route>

            <Route path="*" element={ <ErrorPage/> }/>
        </Route>
    ])
    const router = createBrowserRouter(routes, {
        // Supports deployment under a sub-path (see `base` in vite.config.ts).
        basename: import.meta.env.BASE_URL,
    })

    return (
        <ThemeProvider theme={ LIGHT_THEME }>
            <FontsVTBGroup/>
            <RouterProvider router={ router }/>
        </ThemeProvider>
    )
};

export const serviceLoader = async ({ params }: LoaderFunctionArgs) => {
    const service = await getService(params.serviceName)
    if (service === undefined) {
        // The URL can name a service that is missing from `settings.yml` (a renamed or removed one),
        // and `NavBar` reads `service.name` immediately — returning `undefined` crashed the whole route
        // tree with "Cannot read properties of undefined (reading 'name')". Throwing a route error
        // instead makes react-router render the closest `errorElement` (`ErrorPage`).
        throw new Response('Not Found', { status: 404 })
    }
    return service
}

export const defaultDocumentation = async ({ params }: LoaderFunctionArgs) => {
    const service = await getService(params.serviceName)
    if (hasOpenApi(service)) {
        return redirect("./openapi")
    }
    if (hasAsyncApi(service)) {
        return redirect("./asyncapi")
    }
    return null
}
