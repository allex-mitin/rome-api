import { FC } from "react";
import styled from "styled-components";

import openapi from '../assets/openapi.webp';
import asyncapi from '../assets/asyncapi.webp';

const WelcomePageWrapper = styled.div`
    display: flex;
    flex: 1;
    min-width: 0;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 36px;
    padding: 40px;
    text-align: center;
`

const Headline = styled.h1`
    margin: 0;
    font-size: 26px;
    font-weight: 550;
    line-height: 34px;
    color: var(--app-text);
`

const Hint = styled.p`
    max-width: 560px;
    margin: 10px 0 0;
    font-size: 15px;
    line-height: 22px;
    color: var(--app-text-muted);
`

const Cards = styled.div`
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 20px;
`

const Card = styled.a`
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 300px;
    height: 156px;
    padding: 22px;
    border-radius: 16px;
    background: var(--app-surface);
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05), 0 14px 34px -26px rgba(16, 24, 40, 0.4);
    transition: transform 140ms ease, box-shadow 140ms ease;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 2px 4px rgba(16, 24, 40, 0.06), 0 22px 44px -26px rgba(16, 24, 40, 0.45);
    }

    img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
    }
`

export const WelcomePage: FC = () => {
    return (
        <WelcomePageWrapper>
            <div>
                <Headline>Документация API</Headline>
                <Hint>
                    Выберите сервис в списке слева, а нужную операцию, схему или канал можно найти
                    поиском в шапке — он индексирует все спецификации сразу.
                </Hint>
            </div>

            <Cards>
                <Card
                    href={ 'https://www.openapis.org/' }
                    target={ '_blank' }
                    rel="noreferrer"
                    title="Открыть openapis.org"
                >
                    <img src={ openapi } alt="OpenAPI"/>
                </Card>
                <Card
                    href={ 'https://www.asyncapi.com/en' }
                    target={ '_blank' }
                    rel="noreferrer"
                    title="Открыть asyncapi.com"
                >
                    <img src={ asyncapi } alt="AsyncAPI"/>
                </Card>
            </Cards>
        </WelcomePageWrapper>
    )
}
