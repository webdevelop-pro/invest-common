import { computed, ref } from 'vue';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { generalErrorHandling } from 'UiKit/helpers/generalErrorHandling';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { fetchUpdateIdentities } from 'InvestCommon/services/api/plaid';

const isGetUserBackgroundInfoLoading = ref(false);
const isGetUserBackgroundInfoError = ref(false);

export const useKYCIdentityStore = defineStore('KYCIdentity', () => {
  const profilesStore = useProfilesStore();
  const { selectedUserProfileData } = storeToRefs(profilesStore);

  const userId = computed(() => (selectedUserProfileData.value?.user_id || 0));
  const profileId = computed(() => (selectedUserProfileData.value?.id || 0));

  const updateUserPlaidIdentities = async () => {
    isGetUserBackgroundInfoLoading.value = true;
    isGetUserBackgroundInfoError.value = false;
    await fetchUpdateIdentities(userId.value, profileId.value).catch((error: Response) => {
      isGetUserBackgroundInfoError.value = true;
      generalErrorHandling(error);
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
