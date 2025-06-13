import { ref } from 'vue';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { useRepositoryAuth } from 'InvestCommon/data/auth/auth.repository';
import { SELFSERVICE } from './type';
import { useGlobalLoader } from 'InvestCommon/store/useGlobalLoader';
import { redirectAfterLogout } from 'InvestCommon/domain/redirects/redirectAfterLogout';
import { resetAllData } from 'InvestCommon/domain/resetAllData';

export const useLogoutStore = defineStore('logout', () => {
  const authRepository = useRepositoryAuth();
  const { setLogoutState, getAuthFlowState } = storeToRefs(authRepository);

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
