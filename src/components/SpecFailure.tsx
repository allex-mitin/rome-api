import type { FC } from "react";
import styled from "styled-components";

import { AlertIcon, ExternalLinkIcon } from "./icons";
import type { Diagnostic } from "../helpers/specValidation";

interface SpecFailureProps {
    /** The spec that could not be shown — also offered as a link, so the server answer can be checked. */
    url: string;
    /** Everything known about the document; the fatal one becomes the headline. */
    diagnostics: Diagnostic[];
}

/** More than a handful of extra lines turn the state into a wall of text. */
const MAX_DETAILS = 5;

// Sits in the place of the renderer, so it centres itself in the content column and stays readable
// on a wide screen.
const Wrapper = styled.div`
    display: flex;
    flex: 1;
    min-height: 56vh;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    padding: 40px var(--app-gutter);
    text-align: center;
`

const Badge = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: #fef3f2;
    color: #d92d20;
`

const BadgeIcon = styled(AlertIcon)`
    width: 24px;
    height: 24px;
`

const Title = styled.div`
    font-size: 20px;
    font-weight: 600;
    line-height: 28px;
    color: var(--app-text);
`

const Reason = styled.p`
    max-width: 640px;
    margin: 0;
    font-size: 14px;
    line-height: 22px;
    color: var(--app-text-muted);
`

const Hint = styled.div`
    max-width: 640px;
    font-size: 13px;
    line-height: 20px;
    color: var(--app-text-muted);
`

const Details = styled.ul`
    display: flex;
    max-width: 720px;
    flex-direction: column;
    gap: 4px;
    margin: 2px 0 0;
    padding: 0;
    list-style: none;
    text-align: left;
`

const Detail = styled.li`
    color: var(--app-text-muted);
    font-size: 12px;
    line-height: 18px;

    b {
        color: #d92d20;
        font-weight: 600;
    }
`

const SpecLink = styled.a`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    max-width: 720px;
    margin-top: 2px;
    color: var(--app-accent);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12px;
    text-decoration: none;
    word-break: break-all;

    &:hover {
        text-decoration: underline;
    }

    &:focus-visible {
        outline: 2px solid var(--app-accent);
        outline-offset: 2px;
        border-radius: 4px;
    }
`

const LinkIcon = styled(ExternalLinkIcon)`
    flex: 0 0 auto;
    width: 14px;
    height: 14px;
`

export const SpecFailure: FC<SpecFailureProps> = ({ url, diagnostics }) => {
    const headline = diagnostics.find((item) => item.fatal);
    const rest = diagnostics.filter((item) => item !== headline);

    return (
        <Wrapper>
            <Badge><BadgeIcon/></Badge>
            <Title>Спецификацию не удалось показать</Title>

            { headline
                ? <Reason>{ headline.message }</Reason>
                : <Reason>Документ не удалось разобрать: спецификация не соответствует формату.</Reason> }

            { rest.length > 0 && (
                <Details>
                    { rest.slice(0, MAX_DETAILS).map((item, index) => (
                        <Detail key={ `${ item.severity }-${ index }` }>
                            <b>{ item.severity === 'error' ? 'ошибка' : item.severity === 'warning' ? 'предупреждение' : 'замечание' }:</b>
                            { ' ' }{ item.message }
                            { item.location && <>{ ' ' }<code>{ item.location }</code></> }
                        </Detail>
                    )) }
                </Details>
            ) }

            <Hint>
                Проверьте адрес в <b>settings.yml</b> и наличие файла на сервере: если файла нет,
                SPA-фолбэк отвечает HTML-страницей с кодом 200, и вместо спецификации приходит она.
            </Hint>

            <SpecLink href={ url } target="_blank" rel="noreferrer" title="Открыть адрес спецификации">
                <LinkIcon/>
                { url }
            </SpecLink>
        </Wrapper>
    );
};
