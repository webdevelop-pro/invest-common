import { ref } from 'vue';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { useRepositoryAuth } from 'InvestCommon/data/auth/auth.repository';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { redirectAfterLogout } from 'InvestCommon/domain/redirects/redirectAfterLogout';
import { resetAllData } from 'InvestCommon/domain/resetAllData';
import { SELFSERVICE } from 'InvestCommon/data/auth/auth.constants';
import { oryErrorHandling } from 'InvestCommon/domain/error/oryErrorHandling';
import { oryResponseHandling } from 'InvestCommon/domain/error/oryResponseHandling';

export const useLogoutStore = defineStore('logout', () => {
  const authRepository = useRepositoryAuth();
  const { getAuthFlowState, getLogoutState } = storeToRefs(authRepository);

  const resetLogoutFlow = () => {
    void authRepository
      .getAuthFlow(SELFSERVICE.logout)
      .then((flow) => oryResponseHandling(flow as any));
  };

  const isLoading = ref(false);
  const token = ref('');

  // Logout handlers
  const handleLogoutSuccess = async () => {
    useGlobalLoader().show();
    await resetAllData();
    redirectAfterLogout();
  };

  const logoutHandler = async () => {
    token.value = '';
    isLoading.value = true;
    try {
      const flowData = await authRepository.getAuthFlow(SELFSERVICE.logout);
      oryResponseHandling(flowData);
      if (getAuthFlowState.value.error) {
        isLoading.value = false;
        return;
      }
      // get logout token from flow data response
      if (getAuthFlowState.value.data) {
        token.value = getAuthFlowState.value.data.logout_token
          ? getAuthFlowState.value.data.logout_token
          : getAuthFlowState.value.data.logout_url.split('token=')[1].toString();
      }

      await authRepository.getLogout(token.value);
      if (getLogoutState.value.error) {
        isLoading.value = false;
        return;
      }
      await handleLogoutSuccess();
    } catch (error) {
      await oryErrorHandling(
        error as any,
        'logout',
        resetLogoutFlow,
        'Failed to logout',
      );
    } finally {
      isLoading.value = false;
    }
  };

  return {
    isLoading,
    logoutHandler,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useLogoutStore, import.meta.hot));
}
