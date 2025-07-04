import type {FC} from 'react';
import {AsyncApiContainer} from '../components/AsyncApiContainer';
import {LoadingSpec} from '../components/LoadingSpec';

export const AsyncApiPage: FC<{ url: string | undefined | null }> = ({url}) => {
    return !url ? <LoadingSpec withError={true}/> : <AsyncApiContainer url={url}/>;
};
