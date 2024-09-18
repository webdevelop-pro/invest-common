import {
  IPlaidTokenResponse,
} from 'InvestCommon/types/api/plaid';
import env from 'InvestCommon/global';
import { requiredFetchParams } from 'InvestCommon/helpers/requiredFetchParams';

const { PLAID_URL } = env;

// GET IDENTITIES
export const fetchUpdateIdentities = (userId: number, profileId: number) => {
  const path = `${PLAID_URL}/identity/sync/${userId}/${profileId}`;

  const data = {
    method: 'POST',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json();
  });
};

// CREATE TOKEN
export const fetchCreateToken = (profileId: number) => {
  const path = `${PLAID_URL}/kyc/${profileId}`;
  const body = JSON.stringify({});
  // ToDo
  // Add 'csrf_token': csrf_token  to cookies
  const req = {
    body,
    method: 'POST',
    ...requiredFetchParams(),
  };

  return fetch(path, req).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<IPlaidTokenResponse>;
  });
};