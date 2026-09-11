import type { FC } from 'react';
import logoUrl from '../assets/logo.svg';

interface LogoProps {
    className?: string;
}

export const Logo: FC<LogoProps> = ({ className }) => {
    // The artwork is kept in `assets/logo.svg` instead of being inlined: as inline JSX it
    // used to add ~143 kB to the initial bundle.
    return (
        <img
            src={ logoUrl }
            className={ className }
            width={ 34 }
            height={ 35 }
            alt="RomeAPI"
        />
    );
};
