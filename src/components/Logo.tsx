import { useEffect, useState } from 'react';
import type { FC } from 'react';
import styled from 'styled-components';
import logoUrl from '../assets/logo.svg';

interface LogoProps {
    className?: string;
    /** Runtime logo from the branding settings. Falls back to the bundled artwork. */
    src?: string;
    alt?: string;
    /** Height in pixels; the width keeps the aspect ratio of the image. */
    height?: number;
}

const Image = styled.img<{ $height: number }>`
    display: block;
    height: ${({ $height }) => $height}px;
    width: auto;
    max-width: 220px;
    object-fit: contain;
`;

export const Logo: FC<LogoProps> = ({ className, src, alt = 'Rome API', height = 35 }) => {
    // A broken `branding.logo` URL must not leave a torn-image icon in the header: fall back to the
    // artwork bundled with the build. The flag is reset when the URL changes, so a fixed settings
    // file takes effect after a reload.
    const [failed, setFailed] = useState(false);
    const source = failed || !src ? logoUrl : src;

    useEffect(() => {
        setFailed(false);
    }, [src]);

    // The artwork is kept in `assets/logo.svg` instead of being inlined: as inline JSX it
    // used to add ~143 kB to the initial bundle.
    return (
        <Image
            src={ source }
            className={ className }
            $height={ height }
            onError={ () => setFailed(true) }
            alt={ alt }
        />
    );
};
