import type { FC } from 'react';

/**
 * The shell's own icon set. The product must not ship third-party artwork, so every glyph here is
 * drawn from scratch on the same 20×20 grid, with the same 1.6 line weight and the same round caps
 * as the hand-written SVGs in `openapi.css` — the icons have to sit next to the renderers' own
 * markers without looking foreign.
 *
 * `stroke` is `currentColor` and the size is left to the caller, so a glyph is styled from the
 * outside (`styled(SearchIcon)`) exactly like the icons it replaces.
 */
interface IconProps {
    className?: string;
}

const iconProps = {
    viewBox: '0 0 20 20',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
} as const;

export const SearchIcon: FC<IconProps> = ({ className }) => (
    <svg className={ className } { ...iconProps }>
        <circle cx="9" cy="9" r="6"/>
        <path d="M13.4 13.4 17 17"/>
    </svg>
);

export const ChevronDownIcon: FC<IconProps> = ({ className }) => (
    <svg className={ className } { ...iconProps }>
        <path d="M6 8.5 10 12.5 14 8.5"/>
    </svg>
);

/** Opens a document away from the viewer: a frame with the sheet leaving through its top-right. */
export const ExternalLinkIcon: FC<IconProps> = ({ className }) => (
    <svg className={ className } { ...iconProps }>
        <path d="M16.5 3.4 10.6 9.3"/>
        <path d="M13.3 3.4h3.2v3.2"/>
        <path d="M9 5H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-3"/>
    </svg>
);

export const DownloadIcon: FC<IconProps> = ({ className }) => (
    <svg className={ className } { ...iconProps }>
        <path d="M10 3.4v8.8"/>
        <path d="M6.4 8.9 10 12.5 13.6 8.9"/>
        <path d="M4.5 16h11"/>
    </svg>
);

export const CopyIcon: FC<IconProps> = ({ className }) => (
    <svg className={ className } { ...iconProps }>
        <rect x="7.4" y="7.4" width="8.2" height="8.2" rx="2.2"/>
        <path d="M12.6 4.4H6.6A2.2 2.2 0 0 0 4.4 6.6v6"/>
    </svg>
);

export const RefreshIcon: FC<IconProps> = ({ className }) => (
    <svg className={ className } { ...iconProps }>
        <path d="M15.2 7A6 6 0 1 0 16 10"/>
        <path d="M14.4 11.6 16 10l1.6 1.6"/>
    </svg>
);

/** Marks a state where nothing could be shown: a ring with an exclamation mark. */
export const AlertIcon: FC<IconProps> = ({ className }) => (
    <svg className={ className } { ...iconProps }>
        <circle cx="10" cy="10" r="7.2"/>
        <path d="M10 6.2v4.6"/>
        <path d="M10 13.6h.01"/>
    </svg>
);
