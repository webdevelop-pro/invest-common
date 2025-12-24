import { ref, computed, watch } from 'vue';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { ApiClient } from 'InvestCommon/data/service/apiClient';
import env from 'InvestCommon/domain/config/env';
import { toasterErrorHandling } from 'InvestCommon/data/repository/error/toasterErrorHandling';
import { createActionState } from 'InvestCommon/data/repository/repository';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { IKycTokenResponse } from './kyc.types';
import { loadPlaidScriptOnce, PlaidHandler } from 'InvestCommon/data/plaid/loadPlaidScriptOnce';

// Add Plaid window type
declare global {
  interface Window {
    Plaid: {
      create: (config: any) => { open: () => void };
    };
  }
}

// Keep a single Plaid handler within this module
let plaidHandler: PlaidHandler | null = null;
let expectedLinkSessionId: string | null = null;

export const useRepositoryKyc = defineStore('repository-kyc', () => {
  // Dependencies
  const apiClient = new ApiClient();
  const { PLAID_URL } = env;
  const profilesStore = useProfilesStore();
  const { selectedUserProfileData } = storeToRefs(profilesStore);

  // State
  const kycToken = ref<IKycTokenResponse | null>(null);
  const tokenState = createActionState<IKycTokenResponse>();
  const isPlaidLoading = ref(false);
  const isPlaidDone = ref(false);

  // Computed
  const hasValidToken = computed(() => {
    if (!kycToken.value?.link_token || !kycToken.value?.expiration) return false;
    return new Date(kycToken.value.expiration) > new Date();
  });

  // Generalized token creation
  const createToken = async (profileId: number) => {
    tokenState.value.loading = true;
    tokenState.value.error = null;
    try {
      const response = await apiClient.post<IKycTokenResponse>(`${PLAID_URL}/auth/kyc/${profileId}`, {});
      kycToken.value = response.data;
      tokenState.value.data = response.data;
      return response.data;
    } catch (err) {
      tokenState.value.error = err as Error;
      tokenState.value.data = undefined;
      toasterErrorHandling(err, 'Failed to create KYC token');
      throw err;
    } finally {
      tokenState.value.loading = false;
    }
  };

  // Generalized Plaid KYC handler
  const handlePlaidKyc = async (id: number) => {
    if (!selectedUserProfileData.value?.id) return;

    isPlaidLoading.value = true;
    isPlaidDone.value = false;
    try {
      await createToken(id || selectedUserProfileData.value.id);
      if (kycToken.value && kycToken.value.link_token) {
        await loadPlaidScriptOnce();
        expectedLinkSessionId = null;
        plaidHandler = window?.Plaid.create({
          token: kycToken.value?.link_token,
          onSuccess: (publicToken: string, metadata: any) => {
            if (expectedLinkSessionId && metadata?.link_session_id !== expectedLinkSessionId) return;
            isPlaidLoading.value = false;
            isPlaidDone.value = true;
          },
          onLoad: () => {
            console.log('plaid own onload event');
          },
          onExit: (err: unknown, metadata: any) => {
            console.log('plaid on exit event', err, metadata);
            console.log('update account with failed kyc status');
            isPlaidLoading.value = false;
          },
          onEvent: (eventName: string, metadata: any) => {
            if (!expectedLinkSessionId && metadata?.link_session_id) {
              expectedLinkSessionId = metadata.link_session_id;
            }
            console.log('plaid on event', eventName, metadata);
          },
          receivedRedirectUri: null,
        });
        setTimeout(() => { if (plaidHandler) plaidHandler.open(); }, 1000);
      }
    } catch (err) {
      isPlaidLoading.value = false;
      toasterErrorHandling(err, 'Failed to handle Plaid KYC');
    }
  };

  // Reset all state
  const resetAll = () => {
    kycToken.value = null;
    tokenState.value = { loading: false, error: null, data: undefined };
  };

  watch(() => selectedUserProfileData.value.kyc_status, () => {
    isPlaidDone.value = false;
  });

  return {
    kycToken,
    hasValidToken,
    tokenState,
    isPlaidLoading,
    isPlaidDone,
    createToken,
    handlePlaidKyc,
    resetAll,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRepositoryKyc, import.meta.hot));
}
