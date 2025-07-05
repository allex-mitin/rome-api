import type {FC} from 'react';
import {useEffect, useState} from "react";
import {Resolver} from "@stoplight/json-ref-resolver";
import YAML from 'yaml'
// @ts-expect-error - TODO
import AsyncApi from '@asyncapi/react-component/browser';
import styled from "styled-components";
import { Spinner } from '@admiral-ds/react-ui';

import { Parser } from "@asyncapi/parser";

const parser = new Parser();

const asyncApiConfig = {
    schemaID: "asyncapi",
    show: {
        sidebar: true,
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

export const AsyncApiContainer: FC<AsyncApiContainerProps> = ({url}) => {
    const [document, setDocument] = useState<string | undefined>(undefined)
    useEffect(() => {
        (async () => {
            try {
                const parsed = await parseDocument(url)

                const documentOld = YAML.stringify(parsed.old2.result)
                const documentRaw = await parser.parse(parsed.raw2)

                // console.log('test', documentRaw?.document, documentOld);

                // не судите строго
                return setDocument(documentRaw?.document || documentOld)
            } catch (err){
                console.log(err)
            }
        })();

    }, []);

    if(!document){
        return (
            <AsyncApiContainerSpinnerWrapper>
                <Spinner  dimension="xl" />
            </AsyncApiContainerSpinnerWrapper>
        )
    }

    return (
        <AsyncApiContainerWrapper>
            <AsyncApi schema={document} config={asyncApiConfig}/>
        </AsyncApiContainerWrapper>
    )
};

export const parseDocument = async (url: string) => {
    const resolver = new Resolver({
        resolvers: {
            file: {
                resolve: async ref => {
                    const {old} = await readFile(ref.toString())
                    return old[0]
                }
            }
        }
    })

    const {
        old,
        raw
    } = await readFile(url)

    return {
        old2: await resolver.resolve(old[0], {
            baseUri: old[1]
        }),
        raw2: raw
    }
}

export const readFile = async (uri: string) => {
    const file = await fetch(uri)
        .then(async value => {
            const text = await value.text();
            return {
                "text": text,
                "url": value.url
            }
        })

    return {
        old: [YAML.parse(file.text), file.url],
        raw: file.text
    }
}
