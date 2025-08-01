import { ref } from 'vue';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { useRepositoryAuth } from 'InvestCommon/data/auth/auth.repository';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { redirectAfterLogout } from 'InvestCommon/domain/redirects/redirectAfterLogout';
import { resetAllData } from 'InvestCommon/domain/resetAllData';
import { SELFSERVICE } from './type';

export const useLogoutStore = defineStore('logout', () => {
  const authRepository = useRepositoryAuth();
  const { getAuthFlowState, getLogoutState } = storeToRefs(authRepository);

  const isLoading = ref(false);
  const token = ref('');

  // Logout handlers
  const handleLogoutSuccess = () => {
    useGlobalLoader().show();
    redirectAfterLogout();
    resetAllData();
  };

  const logoutHandler = async () => {
    token.value = '';
    isLoading.value = true;
    try {
      await authRepository.getAuthFlow(SELFSERVICE.logout);
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
      handleLogoutSuccess();
    } catch (error) {
      console.error('Login failed:', error);
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
