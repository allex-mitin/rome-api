import type {FC} from 'react';
import SwaggerUI from 'swagger-ui-react';
import {LoadingSpec} from '../components/LoadingSpec';

export const SwaggerPage: FC<{ url: string | undefined | null }> = ({url}) => {
    return !url ? <LoadingSpec withError={true}/> : <SwaggerUI url={url} docExpansion="list" deepLinking/>;
};
