import { FC } from "react";
import styled from "styled-components";

const ErrorWrapper = styled.div`
    display: flex;
    flex: 1;
    align-self: stretch;
    // Also covers the case where the page is rendered outside the shell (a route error).
    min-height: 320px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 40px;
    text-align: center;
`

const ErrorCode = styled.div`
    font-size: 60px;
    font-weight: 550;
    line-height: 1;
    color: #d0d5dd;
`

const ErrorTitle = styled.div`
    margin-top: 8px;
    font-size: 20px;
    font-weight: 550;
    color: var(--app-text);
`

const ErrorHint = styled.div`
    max-width: 520px;
    font-size: 14px;
    line-height: 20px;
    color: var(--app-text-muted);
`

export const ErrorPage: FC = () => {
    return (
        <ErrorWrapper>
            <ErrorCode>404</ErrorCode>
            <ErrorTitle>Страница не найдена</ErrorTitle>
            <ErrorHint>
                Проверьте адрес или выберите сервис в списке слева. Если сервис есть в списке, но
                открывается эта страница — он отсутствует в <b>settings.yml</b>.
            </ErrorHint>
        </ErrorWrapper>
    )
}
