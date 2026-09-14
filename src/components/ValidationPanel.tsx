import { FC, useState } from "react";
import styled from "styled-components";
import type { Diagnostic, DiagnosticSeverity } from "../helpers/specValidation";

interface ValidationPanelProps {
    diagnostics: Diagnostic[];
}

const SEVERITY_ORDER: readonly DiagnosticSeverity[] = ['error', 'warning', 'info'];

const SEVERITY_LABEL: Record<DiagnosticSeverity, string> = {
    error: 'ошибка',
    warning: 'предупреждение',
    info: 'замечание',
};

// Russian plural forms: 1 ошибка / 2 ошибки / 5 ошибок
const SEVERITY_FORMS: Record<DiagnosticSeverity, [string, string, string]> = {
    error: ['ошибка', 'ошибки', 'ошибок'],
    warning: ['предупреждение', 'предупреждения', 'предупреждений'],
    info: ['замечание', 'замечания', 'замечаний'],
};

const SEVERITY_COLOR: Record<DiagnosticSeverity, string> = {
    error: '#d92d20',
    warning: '#b54708',
    info: '#475467',
};

const plural = (count: number, [one, few, many]: [string, string, string]): string => {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
    return many;
};

const Panel = styled.div<{ $hasErrors: boolean }>`
    // In the OpenAPI column the panel is a flex item sitting above the renderer. Its own
    // overflow: hidden (needed for the rounded corners) zeroes the automatic minimum size of a flex
    // item, so without this it gets squeezed to a couple of pixels whenever the rendered spec is
    // taller than the viewport.
    flex: 0 0 auto;
    margin: 12px var(--app-gutter) 0;
    border: 1px solid ${({ $hasErrors }) => ($hasErrors ? '#fda29b' : '#fedf89')};
    background: ${({ $hasErrors }) => ($hasErrors ? '#fef3f2' : '#fffaeb')};
    border-radius: 12px;
    font-size: 13px;
    overflow: hidden;
`

const Header = styled.button`
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 9px 12px;
    border: 0;
    background: transparent;
    cursor: pointer;
    font: inherit;
    text-align: left;
`

const Summary = styled.span`
    font-weight: 600;
`

const Toggle = styled.span`
    color: #475467;
    text-decoration: underline;
    white-space: nowrap;
`

const List = styled.ul`
    margin: 0;
    padding: 0 10px 10px;
    list-style: none;
    max-height: 240px;
    overflow: auto;
`

// Zebra rows instead of a rule above every entry: a long diagnostics list stays readable
// without a stack of horizontal lines.
const Row = styled.li`
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 4px 8px;
    border-radius: 8px;

    &:nth-child(odd) {
        background: rgba(255, 255, 255, 0.6);
    }
`

const Severity = styled.span<{ $severity: DiagnosticSeverity }>`
    flex: 0 0 auto;
    color: ${({ $severity }) => SEVERITY_COLOR[$severity]};
    font-weight: 600;
    text-transform: uppercase;
    font-size: 11px;
    letter-spacing: 0.03em;
`

const Message = styled.span`
    flex: 1 1 auto;
`

const Location = styled.span`
    flex: 0 0 auto;
    color: #475467;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12px;
`

export const ValidationPanel: FC<ValidationPanelProps> = ({ diagnostics }) => {
    const [expanded, setExpanded] = useState(false);

    if (diagnostics.length === 0) {
        return null;
    }

    const counts = SEVERITY_ORDER
        .map((severity) => ({ severity, count: diagnostics.filter((item) => item.severity === severity).length }))
        .filter((entry) => entry.count > 0);

    const hasErrors = counts.some((entry) => entry.severity === 'error');
    const summary = counts
        .map(({ severity, count }) => `${count} ${plural(count, SEVERITY_FORMS[severity])}`)
        .join(', ');

    return (
        <Panel $hasErrors={ hasErrors }>
            <Header type="button" onClick={ () => setExpanded((value) => !value) }>
                <Summary>Проблемы в спецификации: { summary }</Summary>
                <Toggle>{ expanded ? 'Свернуть' : 'Показать' }</Toggle>
            </Header>
            { expanded && (
                <List>
                    { diagnostics.map((item, index) => (
                        <Row key={ `${item.severity}-${index}-${item.message}` }>
                            <Severity $severity={ item.severity }>{ SEVERITY_LABEL[item.severity] }</Severity>
                            <Message>{ item.message }</Message>
                            { item.location && <Location>{ item.location }</Location> }
                        </Row>
                    )) }
                </List>
            ) }
        </Panel>
    );
};
