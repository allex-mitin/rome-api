import { FC } from "react";
import { IconButton } from "@admiral-ds/react-ui";
import { SystemRefreshOutline } from '@admiral-ds/icons'
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

const ButtonsWrapper = styled.div`
    margin-left: auto;
    padding: 10px 10px 10px 10px;
`

export const NavBarButtons: FC = () => {
    const navigate = useNavigate()

    const handleRefresh = () => {
        navigate(0)
    }

    return (
        <ButtonsWrapper>
            <IconButton dimension='m' onClick={ handleRefresh } title="Refresh"><SystemRefreshOutline/></IconButton>
        </ButtonsWrapper>
    )
}
