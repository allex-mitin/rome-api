import { FC } from 'react';
import { Logo } from './Logo';
import { T } from '@admiral-ds/react-ui';
import styled from "styled-components";
import { NavLink } from "react-router-dom";
import { GlobalSearch } from './GlobalSearch';

const HeaderWrapper = styled.div`
    display: flex;
    height: 70px;
    align-items: center;
    padding-left: 20px;
    gap: 20px;
`;

const Search = styled(GlobalSearch)`
    margin-left: auto;
    margin-right: 20px;
`;

export const Header: FC = () => {
    return (
        <HeaderWrapper>
            <NavLink to={'/'}>
                <Logo />
            </NavLink>

            <T font='Header/H6'>
                Rome API - View API documentation service
            </T>

            <Search/>
        </HeaderWrapper>
    );
};
