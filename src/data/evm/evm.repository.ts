import { computed } from 'vue';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { ApiClient } from 'InvestCommon/data/service/apiClient';
import env from 'InvestCommon/domain/config/env';
import { toasterErrorHandling } from 'InvestCommon/data/repository/error/toasterErrorHandling';
import { createActionState } from 'InvestCommon/data/repository/repository';
import { INotification } from 'InvestCommon/data/notifications/notifications.types';
import { EvmWalletFormatter } from './formatter/wallet.formatter';
import {
  IEvmWalletDataFormatted, IEvmWalletDataResponse, IEvmWithdrawRequestBody,
} from './evm.types';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';

export const useRepositoryEvm = defineStore('repository-evm', () => {

    const userProfileStore = useProfilesStore();
    const { selectedUserProfileData, selectedUserProfileId } = storeToRefs(userProfileStore);
    const userSessionStore = useSessionStore();
    const { userLoggedIn } = storeToRefs(userSessionStore);

  const apiClient = new ApiClient(env.EVM_URL);

  const getEvmWalletState = createActionState<IEvmWalletDataFormatted>();
  const withdrawFundsState = createActionState<void>();

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
      if (err?.data?.statusCode !== 404) {
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
      getEvmWalletState.value.data = response.data;
      return getEvmWalletState.value.data;
    } catch (err) {
      withdrawFundsState.value.error = err as Error;
      if (err?.data?.statusCode !== 404) {
        toasterErrorHandling(err, 'Failed to fetch EVM wallet');
      }
      throw err;
    } finally {
      withdrawFundsState.value.loading = false;
    }
  };


    const updateNotificationData = (notification: INotification) => {
        const { fields } = notification.data;
        const wallet = getEvmWalletState.value.data;
        if (!wallet) return;
  
        Object.assign(wallet, fields);
  
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
  };

  return {
    evmWalletId,
    getEvmWalletState,
    withdrawFundsState,
    canLoadEvmWalletData,
    getEvmWalletByProfile,
    withdrawFunds,
    resetAll,
    updateNotificationData,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRepositoryEvm, import.meta.hot));
}
