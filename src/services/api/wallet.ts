import env from 'InvestCommon/global';
import { requiredFetchParams } from 'UiKit/helpers/api/requiredFetchParams';
import { ITransactionDataResponse, IWalletDataResponse } from 'InvestCommon/types/api/wallet';
import { IPlaidLinkTokenResponse, IPlaidLinkExchange, IPlaidLinkProcess } from 'InvestCommon/types/api/plaid';

const { WALLET_URL } = env;

export const fetchGetWalletByProfile = (profile_id: number) => {
  const path = `${WALLET_URL}/auth/wallet/${profile_id}`;

  const data = {
    method: 'GET',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<IWalletDataResponse>;
  });
};

export const fetchGetTransactionsData = (wallet_id: number) => {
  const path = `${WALLET_URL}/auth/wallet/${wallet_id}/transactions`;

  const data = {
    method: 'GET',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<{ items: ITransactionDataResponse[] }>;
  });
};

export const fetchAddBankAccount = (wallet_id: number) => {
  const path = `${WALLET_URL}/auth/wallet/${wallet_id}/bank_account`;

  const data = {
    method: 'PUT',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json();
  });
};

export const fetchAddTransaction = (wallet_id: number, dataToSend: object) => {
  const path = `${WALLET_URL}/auth/wallet/${wallet_id}/transactions`;

  const body = JSON.stringify(dataToSend);

  const data = {
    method: 'POST',
    body,
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json();
  });
};

export const fetchCancelTransaction = (wallet_id: number, transaction_id: number) => {
  const path = `${WALLET_URL}/auth/wallet/${wallet_id}/transactions/${transaction_id}`;

  const body = JSON.stringify({
    action: 'cancel',
  });

  const data = {
    method: 'PUT',
    body,
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json();
  });
};

export const fetchCreateLinkToken = (profileId: number) => {
  const path = `${WALLET_URL}/auth/linkaccount/${profileId}/link`;
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
    return response.json() as Promise<IPlaidLinkTokenResponse>;
  });
};

export const fetchCreateLinkExchange = (profileId: number, body: string) => {
  const path = `${WALLET_URL}/auth/linkaccount/${profileId}/exchange`;
  const req = {
    body,
    method: 'POST',
    ...requiredFetchParams(),
  };

  return fetch(path, req).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<IPlaidLinkExchange>;
  });
};

export const fetchCreateLinkProcess = (profileId: number, body: string) => {
  const path = `${WALLET_URL}/auth/linkaccount/${profileId}/process`;
  const req = {
    body,
    method: 'POST',
    ...requiredFetchParams(),
  };

  return fetch(path, req).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<IPlaidLinkProcess>;
  });
};

export const fetchDeleteLinkedAccount = (profileId: number, body: string) => {
  const path = `${WALLET_URL}/auth/linkaccount/${profileId}`;
  const req = {
    body,
    method: 'DELETE',
    ...requiredFetchParams(),
  };

  return fetch(path, req).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response;
  });
};
