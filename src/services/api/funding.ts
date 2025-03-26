import { IFundingData, IBank } from 'InvestCommon/types/api/funding';
import { requiredFetchParams } from 'UiKit/helpers/api/requiredFetchParams';
import env from 'InvestCommon/global';

const { INVESTMENT_URL, PAYMENTS_URL } = env;

export const fetchGetFunding = () => {
  const path = `${INVESTMENT_URL}/funding`;

  const data = {
    method: 'GET',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<IFundingData>;
  });
};

export const fetchConnectBankAccount = (userId: number, profileId: number, bankData: IBank) => {
  const path = `${PAYMENTS_URL}/account/link/${userId}/${profileId}`;

  const body = JSON.stringify({ ...bankData });

  const data = {
    method: 'POST',
    body,
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<unknown>;
  });
};

export const fetchFundTransfer = (investmentId: number) => {
  const path = `${PAYMENTS_URL}/fund/transfer/${investmentId}`;

  const data = {
    method: 'PUT',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<unknown>;
  });
};
