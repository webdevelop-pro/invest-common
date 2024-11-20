import { computed, ref } from 'vue';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { generalErrorHandling } from 'InvestCommon/helpers/generalErrorHandling';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { fetchUpdateIdentities } from 'InvestCommon/services/api/plaid';

const isGetUserBackgroundInfoLoading = ref(false);
const isGetUserBackgroundInfoError = ref(false);

export const useKYCIdentityStore = defineStore('KYCIdentity', () => {
  const usersStore = useUsersStore();
  const { selectedUserProfileData } = storeToRefs(usersStore);

  const userId = computed(() => (selectedUserProfileData.value?.user_id || 0));
  const profileId = computed(() => (selectedUserProfileData.value?.id || 0));

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
