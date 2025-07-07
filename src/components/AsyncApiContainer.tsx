import type { FC } from 'react';
import { useEffect, useState } from "react";
// @ts-expect-error - TODO
import AsyncApi from '@asyncapi/react-component/browser';
import styled from "styled-components";
import { Spinner } from '@admiral-ds/react-ui';
import type Uri from 'urijs';

import { fromURL, Parser } from "@asyncapi/parser/browser";
import { AsyncAPIDocumentInterface } from "@asyncapi/parser/esm/models";

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
        messageExamples: true,
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
    justify-content: center;
    align-items: center;
`

export const AsyncApiContainer: FC<AsyncApiContainerProps> = ({ url }) => {
    const [document, setDocument] = useState<AsyncAPIDocumentInterface | undefined>(undefined)

    useEffect(() => {
        fromURL(parser, url)
            .parse()
            .then((document) => {
                setDocument(document.document)
            })
    }, [url]);

    if (!document) {
        return (
            <AsyncApiContainerSpinnerWrapper>
                <Spinner dimension="xl"/>
            </AsyncApiContainerSpinnerWrapper>
        )
    }

    return (
        <AsyncApiContainerWrapper>
            <AsyncApi schema={ document } config={ asyncApiConfig }/>
        </AsyncApiContainerWrapper>
    )
};
