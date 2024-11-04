
import env from 'InvestCommon/global';
import { requiredFetchParams } from 'InvestCommon/helpers/requiredFetchParams';
import { IDistributionsData, IDistributionsMeta } from 'InvestCommon/types/api/distributions';

const { DISTRIBUTIONS_URL } = env;


export const fetchGetDistributions = () => {
  const path = `${DISTRIBUTIONS_URL}/protected/1/distribution`;

  const data = {
    method: 'GET',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise< { data: IDistributionsData[]; meta: IDistributionsMeta }>;
  });
};
