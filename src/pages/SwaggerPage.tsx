import { useEffect, useState } from 'react';
import type { FC } from 'react';
import styled from 'styled-components';
import { useLocation } from 'react-router-dom';
import SwaggerUI from 'swagger-ui-react';
import { LoadingSpec } from '../components/LoadingSpec';
import { ValidationPanel } from '../components/ValidationPanel';
import { loadSpecDiagnostics } from '../helpers/specValidation';
import type { Diagnostic } from '../helpers/specValidation';
import type { OpenApiOptions } from '../types';

const PageWrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
`

export const SwaggerPage: FC<{
    url: string | undefined | null
    /** Merged `renderers.openapi` and the spec's own options — see `helpers/rendererOptions`. */
    options?: OpenApiOptions
}> = ({ url, options }) => {
    const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([])
    // Set by the global search when it jumps to a concrete operation. swagger-ui reads the hash only
    // on mount and does not listen to `hashchange`, so a same-page jump needs a remount.
    const jumpToken = (useLocation().state as { jumpToken?: number } | null)?.jumpToken

    useEffect(() => {
        if (!url) {
            setDiagnostics([])
            return
        }
        let cancelled = false
        // swagger-ui reports its own failures, but it cannot tell structural problems from a
        // perfectly valid spec — this pass gives an explicit, uniform list of issues.
        loadSpecDiagnostics(url)
            .then((result) => {
                if (!cancelled) setDiagnostics(result.diagnostics)
            })
            .catch(() => {
                if (!cancelled) setDiagnostics([])
            })
        return () => {
            cancelled = true
        }
    }, [url])

    if (!url) {
        return <LoadingSpec withError={true}/>
    }

    // Options read from the settings file are spread first: `url` and `key` belong to the app, so
    // they are applied last and the config cannot hijack which spec is rendered.
    return (
        <PageWrapper>
            <ValidationPanel diagnostics={ diagnostics }/>
            <SwaggerUI { ...options } key={ jumpToken ?? 'initial' } url={ url }/>
        </PageWrapper>
    )
};
