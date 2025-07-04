import {IconButton, Tooltip} from "@admiral-ds/react-ui";
import {DocumentsCopyOutline, SystemDownloadOutline, SystemRefreshOutline} from '@admiral-ds/icons'
import styled from "styled-components";
import {useNavigate} from "react-router-dom";
import { useRef } from "react";

const ButtonsWrapper = styled.div`
    margin-left: auto;
    padding: 10px 10px 10px 10px;
`

const download = () => {
    return <>
        <IconButton dimension='m' title="Download source"><SystemDownloadOutline/></IconButton>
    </>
}

const copy = () => {
    return <>
        <IconButton dimension='m' title="Copy source"><DocumentsCopyOutline/> </IconButton>
    </>
}

const refresh = () => {
    const navigate = useNavigate()
    const onClick = () => {
        navigate(0)
    }
    return <>
        <IconButton dimension='m' onClick={onClick} title="Refresh"><SystemRefreshOutline/> </IconButton>
    </>
}


export const NavBarButtons: FC = () => {
    const buttons = []

    buttons.push(refresh());
    if (download() != null) buttons.push(download());
    if (copy() != null) buttons.push(copy());


    if (buttons.length === 0) {
        return null;
    }
    return (
        <ButtonsWrapper>
            {buttons}
        </ButtonsWrapper>
    )
}
