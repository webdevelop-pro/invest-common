
import env from 'InvestCommon/global';
import { requiredFetchParams } from 'InvestCommon/helpers/requiredFetchParams';
import { IFilerItem } from 'InvestCommon/types/api/filer';

const { FILER_URL } = env;

export const fetchGetFiles = (object_id: number, object_name: string) => {
  const path = `${FILER_URL}/object/${object_name}/${object_id}`;

  const data = {
    method: 'GET',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<IFilerItem[]>;
  });
};


export const fetchGetPublicFiles = (object_id: number, object_name: string) => {
  const path = `${FILER_URL}/public/object/${object_name}/${object_id}`;

  const data = {
    method: 'GET',
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<IFilerItem[]>;
  });
};
