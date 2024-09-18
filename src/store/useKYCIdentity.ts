import { computed, ref } from 'vue';
import { useCore } from 'InvestCommon/store';
import { generalErrorHandling } from 'InvestCommon/helpers/generalErrorHandling';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { fetchUpdateIdentities } from 'InvestCommon/services';

const isGetUserBackgroundInfoLoading = ref(false);
const isGetUserBackgroundInfoError = ref(false);

export const useKYCIdentityStore = defineStore('KYCIdentity', () => {
  const {
    person,
  } = useCore();

  const userId = computed(() => (person.value.User?.user_id || 0));
  const profileId = computed(() => (person.value.User?.profile_id || 0));

  const updateUserPlaidIdentities = async () => {
    isGetUserBackgroundInfoLoading.value = true;
    isGetUserBackgroundInfoError.value = false;
    await fetchUpdateIdentities(userId.value, profileId.value).catch((error: Response) => {
      isGetUserBackgroundInfoError.value = true;
      void generalErrorHandling(error);
    });
    isGetUserBackgroundInfoLoading.value = false;
  };

  return {
    isGetUserBackgroundInfoLoading,
    isGetUserBackgroundInfoError,
    updateUserPlaidIdentities,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useKYCIdentityStore, import.meta.hot));
}
