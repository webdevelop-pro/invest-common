import { computed } from 'vue';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { ApiClient } from 'InvestCommon/data/service/apiClient';
import env from 'InvestCommon/config/env';
import {
  applyOfflineHydrationMeta,
  createRepositoryStates,
  withActionState,
  type OptionsStateData,
} from 'InvestCommon/data/repository/repository';
import { INotification } from 'InvestCommon/data/notifications/notifications.types';
import { TransactionFormatter } from './formatter/transactions.formatter';
import { WalletFormatter } from './formatter/wallet.formatter';
import { createFormatterCache } from 'InvestCommon/data/repository/formatterCache';
import {
  ITransactionDataResponse, ITransactionDataFormatted, IWalletDataFormatted, IWalletDataResponse,
} from './wallet.types';

type WalletStates = {
  getWalletState: IWalletDataFormatted;
  getTransactionsState: ITransactionDataFormatted[];
  addBankAccountState: OptionsStateData;
  addTransactionState: OptionsStateData;
  cancelTransactionState: OptionsStateData;
  createLinkTokenState: OptionsStateData;
  createLinkExchangeState: OptionsStateData;
  createLinkProcessState: OptionsStateData;
  deleteLinkedAccountState: OptionsStateData;
};

export const useRepositoryWallet = defineStore('repository-wallet', () => {
  const apiClient = new ApiClient(env.WALLET_URL);
  const transactionCache = createFormatterCache<
    ITransactionDataResponse | ITransactionDataFormatted,
    ITransactionDataFormatted
  >({
    getKey: (transaction) => transaction.id,
    getSignature: (transaction) => [
      transaction.updated_at,
      transaction.created_at,
      transaction.status,
      transaction.type,
      transaction.amount,
      transaction.entity_id,
      transaction.description,
      transaction.scan_tx_url,
      transaction.transaction_tx,
      transaction.type_display,
    ].join('|'),
    format: (transaction) => new TransactionFormatter(transaction as ITransactionDataResponse).format(),
  });

  const walletCache = createFormatterCache<IWalletDataResponse | IWalletDataFormatted, IWalletDataFormatted>({
    getKey: (wallet) => wallet.id,
    getSignature: (wallet) => {
      const fundingSource = wallet.funding_source ?? [];
      const fundingSignature = fundingSource
        .map((item) => `${item.id}|${item.status}|${item.type}|${item.name}|${item.bank_name}`)
        .join(';');

      return [
        wallet.id,
        wallet.status,
        wallet.balance,
        wallet.pending_incoming_balance,
        wallet.pending_outcoming_balance,
        fundingSource.length,
        fundingSignature,
      ].join('|');
    },
    format: (wallet) => new WalletFormatter(wallet).format(),
  });

  const {
    getWalletState,
    getTransactionsState,
    addBankAccountState,
    addTransactionState,
    cancelTransactionState,
    createLinkTokenState,
    createLinkExchangeState,
    createLinkProcessState,
    deleteLinkedAccountState,
    resetAll,
  } = createRepositoryStates<WalletStates>({
    getWalletState: undefined,
    getTransactionsState: undefined,
    addBankAccountState: undefined,
    addTransactionState: undefined,
    cancelTransactionState: undefined,
    createLinkTokenState: undefined,
    createLinkExchangeState: undefined,
    createLinkProcessState: undefined,
    deleteLinkedAccountState: undefined,
  });

  const walletId = computed(() => getWalletState.value.data?.id || 0);

  const getWalletByProfile = async (profileId: number) => {
    let responseHeaders: Headers | null = null;
    const result = await withActionState(getWalletState, async () => {
      const response = await apiClient.get<IWalletDataResponse>(`/auth/wallet/${profileId}`);
      responseHeaders = response.headers;
      const data = response.data;
      if (data === undefined) throw new Error('Wallet response missing data');
      return walletCache.format(data);
    });
    if (responseHeaders) {
      applyOfflineHydrationMeta(getWalletState, responseHeaders);
    }
    return result;
  };

  const getTransactions = async (walletIdProp: number) => {
    let responseHeaders: Headers | null = null;
    const result = await withActionState(getTransactionsState, async () => {
      const response = await apiClient.get<{ items: ITransactionDataResponse[] }>(`/auth/wallet/${walletIdProp}/transactions`);
      responseHeaders = response.headers;
      const items = response.data?.items ?? [];
      transactionCache.prune(items);
      const formatted = items.map((transaction: ITransactionDataResponse) => transactionCache.format(transaction));
      return formatted;
    });
    if (responseHeaders) {
      applyOfflineHydrationMeta(getTransactionsState, responseHeaders);
    }
    return result;
  };

  const addBankAccount = async (walletIdProp: number) =>
    withActionState(addBankAccountState, async () => {
      const response = await apiClient.put(`/auth/wallet/${walletIdProp}/bank_account`);
      return response.data;
    });

  const addTransaction = async (walletIdProp: number, dataToSend: object) =>
    withActionState(addTransactionState, async () => {
      const response = await apiClient.post(`/auth/wallet/${walletIdProp}/transactions`, dataToSend);
      return response.data;
    });

  const cancelTransaction = async (walletIdProp: number, transactionId: number) =>
    withActionState(cancelTransactionState, async () => {
      const response = await apiClient.put(`/auth/wallet/${walletIdProp}/transactions/${transactionId}`, { action: 'cancel' });
      return response.data;
    });

  const createLinkToken = async (profileId: number) =>
    withActionState(createLinkTokenState, async () => {
      const response = await apiClient.post(`/auth/linkaccount/${profileId}/link`, {});
      return response.data;
    });

  const createLinkExchange = async (profileId: number, body: unknown) =>
    withActionState(createLinkExchangeState, async () => {
      const response = await apiClient.post(`/auth/linkaccount/${profileId}/exchange`, body);
      return response.data;
    });

  const createLinkProcess = async (profileId: number, body: unknown) =>
    withActionState(createLinkProcessState, async () => {
      const response = await apiClient.post(`/auth/linkaccount/${profileId}/process`, body);
      return response.data;
    });

  const deleteLinkedAccount = async (profileId: number, body: unknown) =>
    withActionState(deleteLinkedAccountState, async () => {
      const response = await apiClient.delete(`/auth/linkaccount/${profileId}`, body);
      return response;
    });

  const updateNotificationData = (notification: INotification) => {
    if (!notification?.data) return;
    const { obj, fields } = notification.data;
    const objectId = fields?.object_id;

    if (obj === 'transaction') {
      if (!objectId || !fields) return;
      const currentList = getTransactionsState.value.data ?? [];
      const index = currentList.findIndex((t) => t.id === objectId);

      if (index !== -1) {
        const updated = { ...currentList[index], ...fields } as ITransactionDataResponse;
        const formatted = transactionCache.format(updated);
        const newList = currentList.map((t, i) => (i === index ? formatted : t));
        getTransactionsState.value.data = newList;
      } else {
        const newItem = { ...fields, id: fields.object_id } as unknown as ITransactionDataResponse;
        const formatted = transactionCache.format(newItem);
        getTransactionsState.value.data = [formatted, ...currentList];
      }
    } else if (obj === 'wallet') {
      const wallet = getWalletState.value.data;
      if (!wallet) return;
      const updated = { ...wallet, ...fields };
      getWalletState.value.data = walletCache.format(updated);
    }
  };

  return {
    walletId,
    getWalletState,
    getTransactionsState,
    addBankAccountState,
    addTransactionState,
    cancelTransactionState,
    createLinkTokenState,
    createLinkExchangeState,
    createLinkProcessState,
    deleteLinkedAccountState,
    getWalletByProfile,
    getTransactions,
    addBankAccount,
    addTransaction,
    cancelTransaction,
    createLinkToken,
    createLinkExchange,
    createLinkProcess,
    deleteLinkedAccount,
    resetAll,
    updateNotificationData,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRepositoryWallet, import.meta.hot));
}
