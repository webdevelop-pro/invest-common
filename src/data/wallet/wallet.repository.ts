import { ref, computed } from 'vue';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { ApiClient } from 'InvestCommon/data/service/apiClient';
import env from 'InvestCommon/global';
import { toasterErrorHandling } from 'InvestCommon/data/repository/error/toasterErrorHandling';
import { createActionState } from 'InvestCommon/data/repository/repository';
import { INotification } from 'InvestCommon/data/notifications/notifications.types';
import { TransactionFormatter } from './formatter/transactions.formatter';
import { WalletFormatter } from './formatter/wallet.formatter';
import {
  ITransactionDataResponse, IWalletDataFormatted, IWalletDataResponse,
} from './wallet.types';

export const useRepositoryWallet = defineStore('repository-wallet', () => {
  const apiClient = new ApiClient(env.WALLET_URL);

  const getWalletState = createActionState<IWalletDataFormatted>();
  const getTransactionsState = createActionState<ITransactionDataResponse[]>();
  const addBankAccountState = createActionState<any>();
  const addTransactionState = createActionState<any>();
  const cancelTransactionState = createActionState<any>();
  const createLinkTokenState = createActionState<any>();
  const createLinkExchangeState = createActionState<any>();
  const createLinkProcessState = createActionState<any>();
  const deleteLinkedAccountState = createActionState<any>();

  const walletId = computed(() => getWalletState.value.data?.id || 0);

  const getWalletByProfile = async (profileId: number) => {
    try {
      getWalletState.value.loading = true;
      getWalletState.value.error = null;
      const response = await apiClient.get<IWalletDataResponse>(`/auth/wallet/${profileId}`);
      const formatted = new WalletFormatter(response.data as any).format();
      getWalletState.value.data = formatted;
      return formatted;
    } catch (err) {
      getWalletState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to fetch wallet');
      throw err;
    } finally {
      getWalletState.value.loading = false;
    }
  };

  const getTransactions = async (walletIdProp: number) => {
    try {
      getTransactionsState.value.loading = true;
      getTransactionsState.value.error = null;
      const response = await apiClient.get<{ items: ITransactionDataResponse[] }>(`/auth/wallet/${walletIdProp}/transactions`);
      getTransactionsState.value.data = response.data.items?.map((transaction: ITransactionDataResponse) => (
        new TransactionFormatter(transaction).format()));
      return response.data.items;
    } catch (err) {
      getTransactionsState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to fetch wallet transactions');
      throw err;
    } finally {
      getTransactionsState.value.loading = false;
    }
  };

  const addBankAccount = async (walletIdProp: number) => {
    try {
      addBankAccountState.value.loading = true;
      addBankAccountState.value.error = null;
      const response = await apiClient.put(`/auth/wallet/${walletIdProp}/bank_account`);
      addBankAccountState.value.data = response.data;
      return response.data;
    } catch (err) {
      addBankAccountState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to add bank account');
      throw err;
    } finally {
      addBankAccountState.value.loading = false;
    }
  };

  const addTransaction = async (walletIdProp: number, dataToSend: object) => {
    try {
      addTransactionState.value.loading = true;
      addTransactionState.value.error = null;
      const response = await apiClient.post(`/auth/wallet/${walletIdProp}/transactions`, dataToSend);
      addTransactionState.value.data = response.data;
      return response.data;
    } catch (err) {
      addTransactionState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to add transaction');
      throw err;
    } finally {
      addTransactionState.value.loading = false;
    }
  };

  const cancelTransaction = async (walletIdProp: number, transactionId: number) => {
    try {
      cancelTransactionState.value.loading = true;
      cancelTransactionState.value.error = null;
      const response = await apiClient.put(`/auth/wallet/${walletIdProp}/transactions/${transactionId}`, { action: 'cancel' });
      cancelTransactionState.value.data = response.data;
      return response.data;
    } catch (err) {
      cancelTransactionState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to cancel transaction');
      throw err;
    } finally {
      cancelTransactionState.value.loading = false;
    }
  };

  const createLinkToken = async (profileId: number) => {
    try {
      createLinkTokenState.value.loading = true;
      createLinkTokenState.value.error = null;
      const response = await apiClient.post(`/auth/linkaccount/${profileId}/link`, {});
      createLinkTokenState.value.data = response.data;
      return response.data;
    } catch (err) {
      createLinkTokenState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to create link token');
      throw err;
    } finally {
      createLinkTokenState.value.loading = false;
    }
  };

  const createLinkExchange = async (profileId: number, body: string) => {
    try {
      createLinkExchangeState.value.loading = true;
      createLinkExchangeState.value.error = null;
      const response = await apiClient.post(`/auth/linkaccount/${profileId}/exchange`, body);
      createLinkExchangeState.value.data = response.data;
      return response.data;
    } catch (err) {
      createLinkExchangeState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to exchange link token');
      throw err;
    } finally {
      createLinkExchangeState.value.loading = false;
    }
  };

  const createLinkProcess = async (profileId: number, body: string) => {
    try {
      createLinkProcessState.value.loading = true;
      createLinkProcessState.value.error = null;
      const response = await apiClient.post(`/auth/linkaccount/${profileId}/process`, body);
      createLinkProcessState.value.data = response.data;
      return response.data;
    } catch (err) {
      createLinkProcessState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to process link token');
      throw err;
    } finally {
      createLinkProcessState.value.loading = false;
    }
  };

  const deleteLinkedAccount = async (profileId: number, body: string) => {
    try {
      deleteLinkedAccountState.value.loading = true;
      deleteLinkedAccountState.value.error = null;
      const response = await apiClient.delete(`/auth/linkaccount/${profileId}`, body);
      deleteLinkedAccountState.value.data = response.data;
      return response.data;
    } catch (err) {
      deleteLinkedAccountState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to delete linked account');
      throw err;
    } finally {
      deleteLinkedAccountState.value.loading = false;
    }
  };

  const updateNotificationData = (notification: INotification) => {
    const objectId = notification.data.fields.object_id;
    if (notification.data.obj === 'transaction') {
      const list = getTransactionsState.value.data;
      if (list && objectId !== undefined) {
        const item = list.find((itemLocal: { id: number }) => itemLocal.id === objectId);
        if (item && notification.data.fields) {
          Object.assign(item, notification.data.fields);
          const formatted = new TransactionFormatter(item).format();
          Object.assign(item, formatted);
        }
      }
      getTransactions(walletId.value);
    } else if (notification.data.obj === 'wallet') {
      let temp = getWalletState.value.data;
      Object.assign(temp, notification.data.fields);
      if (notification.data.fields?.inc_balance !== undefined) {
        temp.pending_incoming_balance = notification.data.fields.inc_balance;
      }
      if (notification.data.fields?.out_balance !== undefined) {
        temp.pending_outcoming_balance = notification.data.fields.out_balance;
      }
      const formatted = new WalletFormatter(temp as any).format();
      getWalletState.value.data = formatted;
    }
  };

  const resetAll = () => {
    getWalletState.value = { loading: false, error: null, data: undefined };
    getTransactionsState.value = { loading: false, error: null, data: undefined };
    addBankAccountState.value = { loading: false, error: null, data: undefined };
    addTransactionState.value = { loading: false, error: null, data: undefined };
    cancelTransactionState.value = { loading: false, error: null, data: undefined };
    createLinkTokenState.value = { loading: false, error: null, data: undefined };
    createLinkExchangeState.value = { loading: false, error: null, data: undefined };
    createLinkProcessState.value = { loading: false, error: null, data: undefined };
    deleteLinkedAccountState.value = { loading: false, error: null, data: undefined };
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
