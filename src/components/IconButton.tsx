import type { FC, ReactNode } from 'react';
import styled from 'styled-components';
import { Spinner } from './Spinner';

// A square that only shows its chrome on hover/focus: the toolbar is a strip of flat controls, so
// the button itself is invisible until it is pointed at.
const Button = styled.button<{ $loading: boolean }>`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    box-sizing: border-box;
    padding: 0;
    border: 0;
    border-radius: 9px;
    background: transparent;
    color: var(--app-text-muted);
    cursor: pointer;
    transition: background 120ms ease, color 120ms ease;

    svg {
        display: block;
        width: 18px;
        height: 18px;
    }

    &:hover {
        background: var(--app-hover);
        color: var(--app-text);
    }

    &:focus-visible {
        outline: 2px solid var(--app-accent);
        outline-offset: 1px;
    }

    &:disabled {
        cursor: default;
        // A running download is disabled as well, but it must stay readable while it spins.
        opacity: ${({ $loading }) => $loading ? 1 : 0.45};
    }
`;

interface IconButtonProps {
    children: ReactNode;
    onClick?: () => void;
    /** Tooltip of the control; also used as the accessible name when `aria-label` is not given. */
    title?: string;
    'aria-label'?: string;
    /** Shows the spinner instead of the icon and makes the button unavailable. */
    loading?: boolean;
    disabled?: boolean;
    className?: string;
}

export const IconButton: FC<IconButtonProps> = ({
    children,
    onClick,
    title,
    'aria-label': ariaLabel,
    loading = false,
    disabled = false,
    className,
}) => (
    <Button
        className={ className }
        type="button"
        $loading={ loading }
        disabled={ disabled || loading }
        title={ title }
        aria-label={ ariaLabel }
        aria-busy={ loading }
        onClick={ onClick }
    >
        { loading ? <Spinner size="m" label={ title ?? 'Загрузка' }/> : children }
    </Button>
);
