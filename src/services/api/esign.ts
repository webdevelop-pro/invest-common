import { v4 as uuidv4 } from 'uuid';
import { IInvestDocumentSign } from 'InvestCommon/types/api/invest';
import env from 'InvestCommon/global';

const { ESIGN_URL } = env;

const requiredFetchParams = () => ({
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include' as RequestCredentials,
});

export const fetchSetDocument = (
  slug: string,
  investId: string,
  profileId: string,
) => {
  const path = `${ESIGN_URL}/auth/create_document/${slug}/esign/${investId}/${profileId}`;

  const data = {
    method: 'POST',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<IInvestDocumentSign>;
  });
};

export const fetchGetDocument = (
  investId: string,
) => {
  const path = `${ESIGN_URL}/auth/get_document/${investId}`;

  const data = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/pdf',
      accept: 'application/pdf',
      'X-Request-ID': uuidv4() as string,
    },
    credentials: 'include' as RequestCredentials,
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.blob();
  });
}; 