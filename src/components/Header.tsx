import { FC } from 'react';
import { NavLink } from 'react-router-dom';
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

// The colour of both lines comes from the branding settings, so it is passed down as a prop instead
// of being picked from a palette.
const Title = styled.span<{ $color: string }>`
    display: block;
    font-size: 20px;
    line-height: 28px;
    font-weight: 600;
    color: ${({ $color }) => $color};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const Subtitle = styled.span<{ $color: string }>`
    display: block;
    margin-top: 2px;
    font-size: 14px;
    line-height: 20px;
    font-weight: 400;
    color: ${({ $color }) => $color};
    opacity: 0.72;
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
                <Title $color={ branding.textColor }>{ branding.title }</Title>
                { branding.subtitle && (
                    <Subtitle $color={ branding.textColor }>{ branding.subtitle }</Subtitle>
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
