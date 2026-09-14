import type { FC } from 'react';
import styled, { keyframes } from 'styled-components';

const SIZES = {
    m: 20,
    l: 28,
    xl: 40,
} as const;

export type SpinnerSize = keyof typeof SIZES;

const spin = keyframes`
    to {
        transform: rotate(360deg);
    }
`;

// A ring made of nothing but a border: the bottom three sides are the accent colour faded into the
// background, the top side carries the accent itself, and the whole thing rotates.
const Ring = styled.span<{ $size: number }>`
    display: inline-block;
    flex: 0 0 auto;
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
    box-sizing: border-box;
    border: 2px solid color-mix(in srgb, var(--app-accent) 25%, transparent);
    border-top-color: var(--app-accent);
    border-radius: 50%;
    animation: ${ spin } .8s linear infinite;

    @media (prefers-reduced-motion: reduce) {
        animation: none;
    }
`;

interface SpinnerProps {
    /** `m` — 20px, `l` — 28px, `xl` — 40px. */
    size?: SpinnerSize;
    /** Announced by screen readers; the ring itself carries no text. */
    label?: string;
    className?: string;
}

export const Spinner: FC<SpinnerProps> = ({ size = 'm', label = 'Загрузка', className }) => (
    <Ring
        className={ className }
        $size={ SIZES[size] }
        role="status"
        aria-label={ label }
    />
);
