import { computed, ref } from 'vue';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { ApiClient } from 'InvestCommon/data/service/apiClient';
import env from 'InvestCommon/domain/config/env';
import { toasterErrorHandling } from 'InvestCommon/data/repository/error/toasterErrorHandling';
import { createActionState } from 'InvestCommon/data/repository/repository';
import { INotification } from 'InvestCommon/data/notifications/notifications.types';
import { EvmWalletFormatter } from './formatter/wallet.formatter';
import {
  IEvmWalletDataFormatted, IEvmWalletDataResponse, IEvmWithdrawRequestBody,
  IEvmExchangeRequestBody, IEvmExchangeResponse,
} from './evm.types';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';

export const useRepositoryEvm = defineStore('repository-evm', () => {

    const userProfileStore = useProfilesStore();
    const { selectedUserProfileData, selectedUserProfileId } = storeToRefs(userProfileStore);
    const userSessionStore = useSessionStore();
    const { userLoggedIn } = storeToRefs(userSessionStore);

  const apiClient = new ApiClient((env as any).EVM_URL);

  const getEvmWalletState = createActionState<IEvmWalletDataFormatted>();
  const withdrawFundsState = createActionState<IEvmWalletDataResponse>();
  const exchangeTokensState = createActionState<IEvmExchangeResponse>();

  // Loading states for websocket updates
  const isLoadingNotificationTransaction = ref(false);
  const isLoadingNotificationWallet = ref(false);

  const evmWalletId = computed(() => getEvmWalletState.value.data?.id || 0);

  const getEvmWalletByProfile = async (profileId: number) => {
    try {
      getEvmWalletState.value.loading = true;
      getEvmWalletState.value.error = null;
      const response = await apiClient.get<IEvmWalletDataResponse>(`/auth/wallet/${profileId}`);
      const formatted = new EvmWalletFormatter(response.data as any).format();
      getEvmWalletState.value.data = formatted;
      return formatted;
    } catch (err) {
      getEvmWalletState.value.error = err as Error;
      if ((err as any)?.data?.statusCode !== 404) {
        toasterErrorHandling(err, 'Failed to fetch EVM wallet');
      }
      throw err;
    } finally {
      getEvmWalletState.value.loading = false;
    }
  };

  const withdrawFunds = async (body: IEvmWithdrawRequestBody) => {
    try {
      withdrawFundsState.value.loading = true;
      withdrawFundsState.value.error = null;
      const response = await apiClient.post<IEvmWalletDataResponse>(`/auth/withdrawal`, body);
      withdrawFundsState.value.data = response.data;
      return withdrawFundsState.value.data;
    } catch (err) {
      withdrawFundsState.value.error = err as Error;
      if ((err as any)?.data?.statusCode !== 404) {
        toasterErrorHandling(err, 'Failed to withdraw funds');
      }
      throw err;
    } finally {
      withdrawFundsState.value.loading = false;
    }
  };

  const exchangeTokens = async (body: IEvmExchangeRequestBody) => {
    try {
      exchangeTokensState.value.loading = true;
      exchangeTokensState.value.error = null;
      const response = await apiClient.post<IEvmExchangeResponse>(`/auth/exchange`, body);
      exchangeTokensState.value.data = response.data;
      return response.data;
    } catch (err) {
      exchangeTokensState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to exchange tokens');
      throw err;
    } finally {
      exchangeTokensState.value.loading = false;
    }
  };


  const updateNotificationData = (notification: INotification) => {
    const { obj, fields } = notification.data;
    const wallet = getEvmWalletState.value.data;
    
    if (!wallet || !fields) return;

    const setTempLoading = (flag: typeof isLoadingNotificationWallet | typeof isLoadingNotificationTransaction) => {
      flag.value = true;
      setTimeout(() => { flag.value = false; }, 2000);
    };

    const upsertTransaction = () => {
      setTempLoading(isLoadingNotificationTransaction);
      const objectId = fields?.object_id;
      if (!objectId || typeof objectId !== 'number') return;
      const list = wallet.transactions as any[];
      const index = list?.findIndex((t: any) => t.id === objectId);
      if (index !== -1) Object.assign(list[index], fields);
      else list?.unshift({ ...fields, id: objectId });
    };

    const upsertWallet = () => {
      setTempLoading(isLoadingNotificationWallet);
      Object.assign(wallet, fields);
    };

    const upsertBalance = () => {
      setTempLoading(isLoadingNotificationWallet);
      const objectId = fields?.object_id;
      const addressFromFields = fields?.address || '';
      if (objectId == null && !addressFromFields) return;
      const update: any = { ...fields };
      update.amount = Number(update.amount ?? 0);
      delete update.object_id;

      const balances = wallet.balances as any;
      const balancesMap: Record<string, any> = (balances && !Array.isArray(balances)) ? balances : {};

      // 1) Try update by address key if present
      if (addressFromFields && balancesMap[addressFromFields]) {
        Object.assign(balancesMap[addressFromFields], update);
        return;
      }

      // 2) Otherwise find entry by id === objectId and update it
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const foundKey = Object.entries(balancesMap).find(([_, v]) => v?.id === objectId)?.[0];
      if (foundKey) {
        Object.assign(balancesMap[foundKey], update);
        return;
      }

      // 3) If not found, create new entry keyed by address (when provided)
      if (addressFromFields) {
        const base = { address: addressFromFields, amount: 0, symbol: '', name: undefined, icon: undefined };
        balancesMap[addressFromFields] = Object.assign(base, update);
      }
    };

    switch (obj) {
      case 'evm_transfer':
        upsertTransaction();
        break;
      case 'evm_wallet':
        upsertWallet();
        break;
      case 'evm_contract':
        upsertBalance();
        break;
      default:
        break;
    }

    getEvmWalletState.value.data = new EvmWalletFormatter(wallet as any).format();
  };

  const selectedIdAsDataIs = computed(() => selectedUserProfileData.value.id === selectedUserProfileId.value);
  const canLoadEvmWalletData = computed(() => (
    !selectedUserProfileData.value.isTypeSdira && selectedIdAsDataIs.value && userLoggedIn.value
    &&  selectedUserProfileData.value.isKycApproved && (selectedUserProfileId.value > 0)
    && !getEvmWalletState.value.loading && (selectedUserProfileId.value > 0)));

  const resetAll = () => {
    getEvmWalletState.value = { loading: false, error: null, data: undefined };
    withdrawFundsState.value = { loading: false, error: null, data: undefined };
    exchangeTokensState.value = { loading: false, error: null, data: undefined };
    isLoadingNotificationTransaction.value = false;
    isLoadingNotificationWallet.value = false;
  };

  return {
    evmWalletId,
    getEvmWalletState,
    withdrawFundsState,
    exchangeTokensState,
    canLoadEvmWalletData,
    getEvmWalletByProfile,
    withdrawFunds,
    exchangeTokens,
    resetAll,
    updateNotificationData,
    isLoadingNotificationTransaction,
    isLoadingNotificationWallet,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRepositoryEvm, import.meta.hot));
}
