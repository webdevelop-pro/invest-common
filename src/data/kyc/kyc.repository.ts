import { ref, computed, watch } from 'vue';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { ApiClient } from 'InvestCommon/data/service/apiClient';
import env from 'InvestCommon/global';
import { toasterErrorHandling } from 'InvestCommon/data/repository/error/toasterErrorHandling';
import { createActionState } from 'InvestCommon/data/repository/repository';
import { useRouter } from 'vue-router';
import { ROUTE_DASHBOARD_PORTFOLIO } from 'InvestCommon/helpers/enums/routes';
import { useRedirect } from 'InvestCommon/composable/useRedirect';
import { urlProfilePortfolio } from 'InvestCommon/global/links';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { IKycTokenResponse } from './kyc.types';

// Add Plaid window type
declare global {
  interface Window {
    Plaid: {
      create: (config: any) => { open: () => void };
    };
  }
}

export const useRepositoryKyc = defineStore('repository-kyc', () => {
  // Dependencies
  const apiClient = new ApiClient();
  const { IS_STATIC_SITE, PLAID_URL } = env;
  const profilesStore = useProfilesStore();
  const { selectedUserProfileId, selectedUserProfileData } = storeToRefs(profilesStore);

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
        const plaidScript = document.createElement('script');
        plaidScript.setAttribute('src', 'https://cdn.plaid.com/link/v2/stable/link-initialize.js');
        document.head.appendChild(plaidScript);
        plaidScript.onload = () => {
          const handler = window?.Plaid.create({
            token: kycToken.value?.link_token,
            onSuccess: () => {
              isPlaidLoading.value = false;
              isPlaidDone.value = true;
              // if (IS_STATIC_SITE) {
              //   window.location.href = urlProfilePortfolio(selectedUserProfileId.value);
              // } else {
              //   const { pushTo } = useRedirect();
              //   const router = useRouter();
              //   router.push(pushTo({
              //     name: ROUTE_DASHBOARD_PORTFOLIO,
              //     params: { profileId: selectedUserProfileId.value },
              //   }));
              // }
            },
            onLoad: () => {
              console.log('plaid own onload event');
            },
            onExit: (err: unknown, metadata: unknown) => {
              console.log('plaid on exit event', err, metadata);
              console.log('update account with failed kyc status');
              isPlaidLoading.value = false;
            },
            onEvent: (eventName: string, metadata: any) => {
              console.log('plaid on event', eventName, metadata);
            },
            receivedRedirectUri: null,
          });
          setTimeout(handler.open, 1000);
        };
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
