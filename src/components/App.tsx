import { FC, useEffect } from 'react';
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
import { getService, getSettings, hasAsyncApi, hasOpenApi, Services } from "../helpers";
import { isServiceListHidden } from "../helpers/ui";
import { applyDocumentBranding, useBranding } from '../helpers/branding';
import { Documentation } from "./Documentation";


export const App: FC = () => {
    // The branding also covers the parts of the page that live outside the header: the browser tab
    // and the favicon. It is applied here so it does not depend on the route that is rendered.
    const branding = useBranding();
    useEffect(() => {
        applyDocumentBranding(branding);
    }, [branding]);

    const routes = createRoutesFromElements([
        <Route key="root" path="/" element={ <Layout/> } loader={ settingsLoader }>
            <Route index element={ <WelcomePage/> } loader={ singleServiceRedirect }/>
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

    return (<RouterProvider router={ router }/>)
};

/**
 * Reads the settings before the shell is painted.
 *
 * The service list, the header search and the welcome page all need them, and the spec loaders reuse
 * the same promise (the read is memoized in `src/helpers`). The file is served next to the build, so
 * resolving it after mount would render a shell that has to be corrected a tick later — visible as a
 * service list flashing in on a deployment that hides it.
 */
export const settingsLoader = async () => {
    await getSettings()
    return null
}

/**
 * Sends the site root straight to the only configured service.
 *
 * With `ui.hideServiceListWhenSingle` and exactly one service there is nothing to pick on the
 * showcase page, so the root opens that service instead (`/home` still shows the showcase). A service
 * without a single spec is left alone: there would be nothing to open, and the showcase is the only
 * useful page left.
 */
export const singleServiceRedirect = async () => {
    const services = await Services()
    if (!isServiceListHidden(services)) {
        return null
    }
    const onlyService = services[0]
    if (!hasOpenApi(onlyService) && !hasAsyncApi(onlyService)) {
        return null
    }
    return redirect(`/service/${ onlyService.path }`)
}

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
