import {IconButton} from "@admiral-ds/react-ui";
import {SystemRefreshOutline} from '@admiral-ds/icons'
import styled from "styled-components";
import {useNavigate} from "react-router-dom";

const ButtonsWrapper = styled.div`
    margin-left: auto;
    padding: 10px 10px 10px 10px;
`

// const download = () => {
//     const params = useParams();
//     const service = useLoaderData() as Service
//     const specification = getSpecification(service, params.documentation, params.version)
//
//     if (specification?.currentUrl() == null) {
//         return null;
//     }
//     return <>
//         <IconButton dimension='m' title="Download source"><SystemDownloadOutline/></IconButton>
//     </>
// }

// const copy = () => {
//     const params = useParams();
//     const service = useLoaderData() as Service
//     const specification = getSpecification(service, params.documentation, params.version)
//
//     if (specification?.currentUrl() == null) {
//         return null;
//     }
//
//     return <>
//         <IconButton dimension='m' title="Copy source"><DocumentsCopyOutline/> </IconButton>
//     </>
// }

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
    // if (download() != null) buttons.push(download());
    // if (copy() != null) buttons.push(copy());


    if (buttons.length === 0) {
        return null;
    }
    return (
        <ButtonsWrapper>
            {buttons}
        </ButtonsWrapper>
    )
}
