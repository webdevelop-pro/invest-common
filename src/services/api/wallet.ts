import env from 'InvestCommon/global';
import { requiredFetchParams } from 'InvestCommon/helpers/requiredFetchParams';
import { ITransactionDataResponse, IWalletDataResponse, WalletAddTransactionTypes } from 'InvestCommon/types/api/wallet';

const { WALLET_URL } = env;

export const fetchGetWalletData = (wallet_id: number) => {
  const path = `${WALLET_URL}/auth/wallet/${wallet_id}`;

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

export const fetchAddTransaction = (wallet_id: number, type: WalletAddTransactionTypes, amountNum: number) => {
  const path = `${WALLET_URL}/auth/wallet/${wallet_id}/transactions`;

  const body = JSON.stringify({
    type,
    amount: Number(amountNum),
  });

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
