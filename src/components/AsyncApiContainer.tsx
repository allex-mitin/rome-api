import type { FC } from 'react';
import { useEffect, useState } from "react";
// @ts-expect-error - the browser bundle of the asyncapi react component ships without types
import AsyncApi from '@asyncapi/react-component/browser';
import styled from "styled-components";
import { Spinner } from '@admiral-ds/react-ui';
import type Uri from 'urijs';

import { fromURL, ParseOutput, Parser } from "@asyncapi/parser";

import { ValidationPanel } from "./ValidationPanel";
import { fromSpectralDiagnostic } from "../helpers/specValidation";
import { htmlInsteadOfSpec, isHtmlPage } from "../helpers/specBundler";

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

const asyncApiConfig = {
    schemaID: "asyncapi",
    show: {
        sidebar: false,
        info: true,
        servers: true,
        operations: true,
        messages: true,
        messageExamples: true,
        schemas: true,
        errors: true
    },
    expand: {
        messageExamples: false,
    },
    sidebar: {
        showServers: 'byDefault',
        showOperations: 'byDefault',
        useChannelAddressAsIdentifier: true,
    },
    parserOptions: {}
};

interface AsyncApiContainerProps {
    url: string;
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

export const AsyncApiContainer: FC<AsyncApiContainerProps> = ({ url }) => {
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

    if (failure) {
        return (
            <AsyncApiContainerWrapper>
                <ValidationPanel diagnostics={ [{ severity: 'error', message: failure }] }/>
            </AsyncApiContainerWrapper>
        )
    }

    if (!result) {
        return (
            <AsyncApiContainerSpinnerWrapper>
                <Spinner dimension="xl"/>
            </AsyncApiContainerSpinnerWrapper>
        )
    }

    // The parser reports problems even when it still managed to build a document,
    // so the diagnostics are shown alongside a successfully rendered spec.
    const diagnostics = result.diagnostics.map(fromSpectralDiagnostic)

    return (
        <AsyncApiContainerWrapper>
            <ValidationPanel diagnostics={ diagnostics }/>
            { result.document
                ? <AsyncApi schema={ result.document } config={ asyncApiConfig }/>
                : (
                    <AsyncApiContainerSpinnerWrapper>
                        <div>Спецификацию не удалось разобрать — список проблем выше.</div>
                    </AsyncApiContainerSpinnerWrapper>
                ) }
        </AsyncApiContainerWrapper>
    )
};
