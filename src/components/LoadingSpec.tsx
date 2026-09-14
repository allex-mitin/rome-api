import type { FC } from 'react';
import styled from 'styled-components';
import { Spinner } from './Spinner';

interface LoadingSpecProps {
    /** Set when there is nothing to load: the service has no spec address configured. */
    withError?: boolean;
}

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    min-height: 240px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 32px;
    text-align: center;
`

const Title = styled.div`
    font-size: 16px;
    font-weight: 550;
    color: var(--app-text);
`

const Message = styled.div`
    max-width: 480px;
    font-size: 14px;
    line-height: 20px;
    color: var(--app-text-muted);

    code {
        padding: 1px 5px;
        border-radius: 5px;
        background: var(--app-hover);
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 12px;
    }
`

export const LoadingSpec: FC<LoadingSpecProps> = ({ withError = false }) => {
    if (withError) {
        return (
            <Wrapper>
                <Title>Спецификация не настроена</Title>
                <Message>
                    Для этого сервиса не указан адрес спецификации в <b>settings.yml</b> — добавьте
                    секцию <code>openapi</code> или <code>asyncapi</code>.
                </Message>
            </Wrapper>
        )
    }

    return (
        <Wrapper>
            <Spinner size="xl"/>
            <Message>Загружаю спецификацию…</Message>
        </Wrapper>
    )
};
