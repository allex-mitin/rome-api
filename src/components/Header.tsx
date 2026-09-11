import { FC } from 'react';
import { NavLink } from 'react-router-dom';
import { T } from '@admiral-ds/react-ui';
import styled, { css } from 'styled-components';
import { Logo } from './Logo';
import { GlobalSearch } from './GlobalSearch';
import { useBranding } from '../helpers/branding';

// `settings.yml` can name an organisation's own page here, so the header must be able to leave the
// app as well as navigate inside it.
const isExternalLink = (link: string): boolean => /^([a-z][a-z0-9+.-]*:)?\/\//i.test(link);

const HeaderWrapper = styled.header<{
    $background: string
}>`
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 16px;
    height: 64px;
    flex: 0 0 auto;
    padding: 0 20px;
    background: ${({ $background }) => $background};
    position: relative;
    z-index: 5;
    // No border and no shadow: any of them renders as a stripe across the page. The header is set
    // apart by its own background against the shell colour instead.
`;

const brandStyles = css`
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    color: inherit;
    text-decoration: none;
`;

const BrandLink = styled.a`
    ${ brandStyles }
`;

const BrandNavLink = styled(NavLink)`
    ${ brandStyles }
`;

const BrandText = styled.div`
    display: flex;
    flex-direction: column;
    min-width: 0;
`;

// The design system types the `color` prop of `T` as a palette name, while the colour comes from the
// settings file, so it is applied through the mixin that is rendered last.
const titleStyles = css`
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const subtitleStyles = css`
    display: block;
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const Search = styled(GlobalSearch)`
    margin-left: auto;
`;

export const Header: FC = () => {
    const branding = useBranding();

    const brand = (
        <>
            <Logo src={ branding.logo } alt={ branding.logoAlt } height={ branding.logoHeight }/>
            <BrandText>
                <T font='Header/H5' cssMixin={ css`${ titleStyles } color: ${ branding.textColor };` }>
                    { branding.title }
                </T>
                { branding.subtitle && (
                    <T
                        font='Body/Body 2 Short'
                        cssMixin={ css`${ subtitleStyles } color: ${ branding.textColor }; opacity: 0.72;` }
                    >
                        { branding.subtitle }
                    </T>
                ) }
            </BrandText>
        </>
    );

    return (
        <HeaderWrapper $background={ branding.background }>
            { isExternalLink(branding.link)
                ? <BrandLink href={ branding.link } target="_blank" rel="noreferrer">{ brand }</BrandLink>
                : <BrandNavLink to={ branding.link }>{ brand }</BrandNavLink> }

            <Search/>
        </HeaderWrapper>
    );
};
