import type { FC } from 'react';
import { useEffect, useState } from "react";
// @ts-expect-error - the browser bundle of the asyncapi react component ships without types
import AsyncApi from '@asyncapi/react-component/browser';
import styled from "styled-components";
import { Spinner } from './Spinner';
import type Uri from 'urijs';

import { fromURL, ParseOutput, Parser } from "@asyncapi/parser";

import { ValidationPanel } from "./ValidationPanel";
import { SpecFailure } from "./SpecFailure";
import { fromSpectralDiagnostic } from "../helpers/specValidation";
import { htmlInsteadOfSpec, isHtmlPage } from "../helpers/specBundler";
import type { AsyncApiOptions } from "../types";

const customFileResolver = (url: Uri) => {
    return fetch(url.path())
        .then(value => {
            return value.text()
        })
}

const parser = new Parser({
    __unstable: {
        resolver: {
            resolvers: [
                {
                    schema: 'file',
                    read: customFileResolver
                }
            ]
        }
    }
});

interface AsyncApiContainerProps {
    url: string;
    /** Merged `renderers.asyncapi` and the spec's own options — see `helpers/rendererOptions`. */
    options?: AsyncApiOptions;
}

const AsyncApiContainerWrapper = styled.div`
    width: 100%;
`

const AsyncApiContainerSpinnerWrapper = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`

export const AsyncApiContainer: FC<AsyncApiContainerProps> = ({ url, options }) => {
    const [result, setResult] = useState<ParseOutput | undefined>(undefined)
    const [failure, setFailure] = useState<string | null>(null)

    useEffect(() => {
        setFailure(null)
        let cancelled = false
        // The URL is fetched up front on purpose: a spec that does not exist is answered by the SPA
        // entry point (HTTP 200 + HTML), and the parser would then report a misleading
        // "This is not an AsyncAPI document" instead of pointing at the missing file.
        fetch(url)
            .then(async (response) => {
                const text = await response.text()
                if (!response.ok) {
                    throw new Error(`Не удалось загрузить ${ url }: ${ response.status }`)
                }
                if (isHtmlPage(text)) {
                    throw htmlInsteadOfSpec(url)
                }
            })
            .then(() => fromURL(parser, url).parse())
            .then((parsed) => {
                if (!cancelled) setResult(parsed)
            })
            .catch((cause: unknown) => {
                if (!cancelled) setFailure(cause instanceof Error ? cause.message : String(cause))
            })
        return () => {
            cancelled = true
        }
    }, [url]);

    // Nothing was fetched or parsed: the reason is the whole story, so it goes into our own failure
    // state. Before, it was only inside a panel whose message is collapsed by default, which left the
    // page looking empty.
    if (failure) {
        return <SpecFailure url={ url } diagnostics={ [{ severity: 'error', message: failure, fatal: true }] }/>
    }

    if (!result) {
        return (
            <AsyncApiContainerSpinnerWrapper>
                <Spinner size="xl"/>
            </AsyncApiContainerSpinnerWrapper>
        )
    }

    const diagnostics = result.diagnostics.map(fromSpectralDiagnostic)

    // A parse result without a document has nothing to render.
    if (!result.document) {
        return <SpecFailure url={ url } diagnostics={ diagnostics }/>
    }

    // The parser reports problems even when it still managed to build a document,
    // so the diagnostics are shown alongside a successfully rendered spec.
    return (
        <AsyncApiContainerWrapper>
            <ValidationPanel diagnostics={ diagnostics }/>
            <AsyncApi schema={ result.document } config={ options }/>
        </AsyncApiContainerWrapper>
    )
};
