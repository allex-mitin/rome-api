import type {FC} from 'react';
import {AsyncApiContainer} from '../components/AsyncApiContainer';
import {LoadingSpec} from '../components/LoadingSpec';
import type {AsyncApiOptions} from '../types';

export const AsyncApiPage: FC<{
    url: string | undefined | null
    /** Merged `renderers.asyncapi` and the spec's own options — see `helpers/rendererOptions`. */
    options?: AsyncApiOptions
}> = ({url, options}) => {
    return !url ? <LoadingSpec withError={true}/> : <AsyncApiContainer url={url} options={options}/>;
};
