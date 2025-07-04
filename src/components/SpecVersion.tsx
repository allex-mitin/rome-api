import {FC} from "react";
import styled from "styled-components";
import {useLoaderData, useNavigate, useParams} from "react-router-dom";
import {Select, Option} from "@admiral-ds/react-ui";
import {getSpecification} from "../helpers";


const SpecVersionWrapper = styled.div`
    width: 200px;
`

export const SpecVersion: FC = () => {
    const params = useParams()
    const service = useLoaderData() as Service
    const navigate = useNavigate()

    const specification = getSpecification(service, params.documentation, params.version)

    if (!specification?.spec()?.urls) return null;

    const urls = specification?.urls()
    const value = specification?.currentUrl()?.version ?? specification?.defaultUrl()?.version

    const handleChangeVersion = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const serviceName = params.serviceName;
        const documentation = params.documentation
        const version = e.target.value
        navigate(`/service/${serviceName}/${documentation}/${version}`)
    }

    return (
        <SpecVersionWrapper>
            <Select mode="select"  dimension="s" value={value} onChange={handleChangeVersion} >
                    {
                        Array.from(urls.entries()).map(([key, _]) => (
                            <Option value={key} key={key}>{key}</Option>
                        ))
                    }
        </Select>
</SpecVersionWrapper>
)
    ;
};
