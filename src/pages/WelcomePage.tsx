import { FC, useEffect, useState } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { ExternalLinkIcon } from "../components/icons";

import openapiLogo from '../assets/openapi-logo.webp';
import asyncapiLogo from '../assets/asyncapi-logo.webp';
import { Services } from "../helpers";
import type { Service } from "../types";

const WelcomePageWrapper = styled.div`
    display: flex;
    flex: 1;
    min-width: 0;
    flex-direction: column;
    overflow: auto;
    padding: 52px var(--app-gutter) 56px;
`

const Inner = styled.div`
    display: flex;
    flex-direction: column;
    gap: 32px;
    width: 100%;
    max-width: 1040px;
    margin: 0 auto;
`

const Headline = styled.h1`
    margin: 0;
    font-size: 30px;
    font-weight: 550;
    line-height: 38px;
    color: var(--app-text);
`

const Lead = styled.p`
    max-width: 660px;
    margin: 12px 0 0;
    font-size: 15px;
    line-height: 24px;
    color: var(--app-text-muted);
`

const SectionTitle = styled.div`
    color: var(--app-text-muted);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
`

const SectionHeader = styled.div`
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
`

const Counter = styled.div`
    color: var(--app-text-muted);
    font-size: 12px;
`

const cardStyles = `
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    border-radius: 14px;
    background: var(--app-surface);
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05), 0 12px 30px -26px rgba(16, 24, 40, 0.45);
`

const cardHover = `
    transform: translateY(-2px);
    box-shadow: 0 2px 4px rgba(16, 24, 40, 0.06), 0 22px 44px -26px rgba(16, 24, 40, 0.5),
        inset 0 0 0 1px color-mix(in srgb, var(--app-accent) 35%, transparent);
`

// Two formats the viewer speaks. The logos are wordmarks, so the card does not repeat their names:
// it explains what the format gives and links to the specification site.
const Formats = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 12px;
`

const FormatCard = styled.a`
    ${ cardStyles }

    gap: 12px;
    padding: 18px 20px;
    color: inherit;
    text-decoration: none;
    transition: transform 140ms ease, box-shadow 140ms ease;

    &:hover {
        ${ cardHover }
    }

    &:focus-visible {
        outline: 2px solid var(--app-accent);
        outline-offset: 2px;
    }
`

const FormatLogo = styled.img`
    display: block;
    height: 30px;
    width: auto;
    max-width: 100%;
    object-fit: contain;
    // The marks are left-aligned by their own left edge, not centred in the card.
    margin-right: auto;
`

const FormatNote = styled.div`
    max-width: 420px;
    font-size: 13px;
    line-height: 19px;
    color: var(--app-text-muted);
`

const FormatLink = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: auto;
    padding-top: 2px;
    color: var(--app-accent);
    font-size: 12px;
    font-weight: 550;
`

const LinkIcon = styled(ExternalLinkIcon)`
    width: 14px;
    height: 14px;
`

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(248px, 1fr));
    gap: 12px;
`

const ServiceCard = styled(Link)`
    ${ cardStyles }

    gap: 10px;
    min-height: 104px;
    padding: 16px 18px;
    color: inherit;
    text-decoration: none;
    transition: transform 140ms ease, box-shadow 140ms ease;

    &:hover {
        ${ cardHover }
    }

    &:focus-visible {
        outline: 2px solid var(--app-accent);
        outline-offset: 2px;
    }
`

const CardTitle = styled.div`
    font-size: 15px;
    font-weight: 550;
    line-height: 21px;
    color: var(--app-text);
    // Long service names wrap to two lines and are then cut, so the grid keeps its rhythm.
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
`

const CardMeta = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-top: auto;
`

const Format = styled.span`
    padding: 2px 7px;
    border-radius: 6px;
    background: var(--app-hover);
    color: var(--app-text-muted);
    font-size: 11px;
    font-weight: 550;
    letter-spacing: 0.02em;
`

const Note = styled.span`
    color: var(--app-text-muted);
    font-size: 12px;
`

const Empty = styled.div`
    padding: 24px 0;
    color: var(--app-text-muted);
    font-size: 14px;
`

const FORMATS = [
    {
        id: 'openapi',
        logo: openapiLogo,
        alt: 'OpenAPI Initiative',
        note: 'REST-контракты: операции, параметры, схемы и примеры ответов.',
        href: 'https://www.openapis.org/',
        site: 'openapis.org',
    },
    {
        id: 'asyncapi',
        logo: asyncapiLogo,
        alt: 'AsyncAPI',
        note: 'Событийные контракты: каналы, сообщения и схемы payload.',
        href: 'https://www.asyncapi.com/',
        site: 'asyncapi.com',
    },
]

/** 1 версия / 2 версии / 5 версий */
const versionLabel = (count: number): string => {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return `${ count } версия`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${ count } версии`;
    return `${ count } версий`;
}

const formatsOf = (service: Service): string[] => {
    const formats: string[] = [];
    if (service.openapi) formats.push('OpenAPI');
    if (service.asyncapi) formats.push('AsyncAPI');
    return formats;
}

const versionCount = (service: Service): number => {
    const counts = [service.openapi, service.asyncapi].map((spec) => spec?.urls ? Object.keys(spec.urls).length : 0);
    return Math.max(...counts, 0);
}

export const WelcomePage: FC = () => {
    // `null` means "not read yet": an empty list renders the empty state, which must not flash
    // while the settings file is still being fetched.
    const [services, setServices] = useState<Service[] | null>(null);

    useEffect(() => {
        Services().then((loaded) => setServices(loaded));
    }, []);

    return (
        <WelcomePageWrapper>
            <Inner>
                <div>
                    <Headline>Документация API</Headline>
                    <Lead>
                        Спецификации OpenAPI и AsyncAPI всех сервисов системы: операции, схемы, каналы,
                        сообщения и версии. Поиск в шапке охватывает все спецификации одновременно.
                    </Lead>
                </div>

                <div>
                    <SectionTitle>Форматы</SectionTitle>
                    <Formats>
                        { FORMATS.map((format) => (
                            <FormatCard
                                key={ format.id }
                                href={ format.href }
                                target="_blank"
                                rel="noreferrer"
                                title={ `Открыть ${ format.site }` }
                            >
                                <FormatLogo src={ format.logo } alt={ format.alt }/>
                                <FormatNote>{ format.note }</FormatNote>
                                <FormatLink>
                                    <LinkIcon/>
                                    { format.site }
                                </FormatLink>
                            </FormatCard>
                        )) }
                    </Formats>
                </div>

                <div>
                    <SectionHeader>
                        <SectionTitle>Сервисы</SectionTitle>
                        { services !== null && services.length > 0 && <Counter>{ services.length }</Counter> }
                    </SectionHeader>

                    { services !== null && services.length === 0 && (
                        <Empty>
                            Сервисы не настроены — добавьте их в <b>settings.yml</b> рядом со сборкой.
                        </Empty>
                    ) }

                    { services !== null && services.length > 0 && (
                        <Grid>
                            { services.map((service) => {
                                const formats = formatsOf(service);

                                return (
                                    <ServiceCard
                                        key={ service.path }
                                        to={ `/service/${ service.path }` }
                                        title={ service.name }
                                    >
                                        <CardTitle>{ service.name }</CardTitle>
                                        <CardMeta>
                                            { formats.map((format) => <Format key={ format }>{ format }</Format>) }
                                            { formats.length === 0 && <Note>нет спецификаций</Note> }
                                            { versionCount(service) > 0 && (
                                                <Note>{ versionLabel(versionCount(service)) }</Note>
                                            ) }
                                        </CardMeta>
                                    </ServiceCard>
                                );
                            }) }
                        </Grid>
                    ) }
                </div>
            </Inner>
        </WelcomePageWrapper>
    )
}
