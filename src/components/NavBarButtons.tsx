import { FC, useState } from "react";
import { CopyIcon, DownloadIcon, RefreshIcon } from "./icons";
import { IconButton } from "./IconButton";
import styled from "styled-components";
import { useLoaderData, useNavigate, useParams } from "react-router-dom";
import { getSpecification } from "../helpers";
import { buildSpecFile, copySpecFile, downloadSpecFile } from "../helpers/specDownload";
import type { BuiltSpecFile, SpecTarget } from "../helpers/specDownload";
import { DocumentationType } from "../models/DocumentationType";
import type { Service } from "../types";

const ButtonsWrapper = styled.div`
    // Grouped with the other controls by spacing alone — no divider line in the toolbar.
    margin-left: 4px;
    display: flex;
    align-items: center;
    gap: 2px;
`

const ErrorText = styled.span`
    color: #d92d20;
    font-size: 12px;
    max-width: 320px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`

export const NavBarButtons: FC = () => {
    const navigate = useNavigate()
    const params = useParams()
    const service = useLoaderData() as Service
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const specification = getSpecification(service, params.documentation, params.version)
    const current = specification?.currentUrl()

    // On the index route the documentation segment is not in the URL yet, so it is derived
    // from the spec that is actually displayed.
    const documentation = params.documentation
        ?? (specification?.type() === DocumentationType.ASYNCAPI ? 'asyncapi' : 'openapi')

    const specUrl = current?.url
    const target: SpecTarget | null = service && specUrl
        ? { service: service.path, documentation, version: current?.version, url: specUrl }
        : null

    const withBundledSpec = async (apply: (file: BuiltSpecFile, target: SpecTarget) => Promise<void> | void) => {
        if (!target || busy) {
            return
        }
        setBusy(true)
        setError(null)
        try {
            const file = await buildSpecFile(target.url)
            await apply(file, target)
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : String(cause))
        } finally {
            setBusy(false)
        }
    }

    const handleRefresh = () => {
        navigate(0)
    }

    const handleDownload = () => withBundledSpec((file, specTarget) => downloadSpecFile(specTarget, file))
    const handleCopy = () => withBundledSpec((file) => copySpecFile(file))

    return (
        <ButtonsWrapper>
            { error && <ErrorText title={ error }>Не удалось собрать спеку</ErrorText> }
            <IconButton
                disabled={ busy }
                loading={ busy }
                onClick={ handleDownload }
                title="Скачать спеку целиком — все внешние $ref будут раскрыты в один файл"
            >
                <DownloadIcon/>
            </IconButton>
            <IconButton
                disabled={ busy }
                onClick={ handleCopy }
                title="Скопировать спеку целиком в буфер обмена"
            >
                <CopyIcon/>
            </IconButton>
            <IconButton onClick={ handleRefresh } title="Refresh"><RefreshIcon/></IconButton>
        </ButtonsWrapper>
    )
}
