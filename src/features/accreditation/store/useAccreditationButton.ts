import {
  ref, computed,
  watch,
} from 'vue';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { useUserProfilesStore } from 'InvestCommon/store/useUserProfiles';
import { AccreditationTypes } from 'InvestCommon/types/api/invest';
import { AccreditationTextStatuses } from 'InvestCommon/data/accreditation/accreditation.types';
import { useRouter } from 'vue-router';
import { ROUTE_ACCREDITATION_UPLOAD, ROUTE_DASHBOARD_PERSONAL_DETAILS } from 'InvestCommon/helpers/enums/routes';

export const useAccreditationButton = defineStore('accreditationButton', () => {
  const router = useRouter();
  const usersStore = useUsersStore();
  const { userLoggedIn, selectedUserProfileData, selectedUserProfileId } = storeToRefs(usersStore);
  const userProfileStore = useUserProfilesStore();
  const { isGetProfileByIdLoading } = storeToRefs(userProfileStore);

  /* * Loading State * */
  const isLoading = ref(true);

  // Watch for notification changes to update loading state
  watch([isGetProfileByIdLoading], ([newLoading]) => {
    isLoading.value = newLoading;
  });

  const data = computed(() => {
    const status = selectedUserProfileData.value?.accreditation_status
      ? selectedUserProfileData.value?.accreditation_status : AccreditationTypes.new;
    return {
      ...AccreditationTextStatuses[status],
      to: {
        name: ROUTE_ACCREDITATION_UPLOAD,
        params: { profileId: selectedUserProfileId.value },
      },
    };
  });
  const tagBackground = computed(() => {
    if (data.value.class === 'success') return 'secondary';
    if (data.value.class === 'failed') return 'red';
    return 'yellow';
  });

  const isAccreditationIsClickable = computed(() => {
    const status = selectedUserProfileData.value?.accreditation_status;
    if (!status) return false;
    return status !== AccreditationTypes.pending && status !== AccreditationTypes.approved;
  });

  const onClick = async () => {
    if (!userLoggedIn.value || !isAccreditationIsClickable.value || !selectedUserProfileId.value) {
      return;
    }
    if (!selectedUserProfileData.value?.escrow_id) {
      router.push({ name: ROUTE_DASHBOARD_PERSONAL_DETAILS, params: { profileId: selectedUserProfileId.value }, query: { accreditation: true } });
    } else {
      router.push({ name: ROUTE_ACCREDITATION_UPLOAD, params: { profileId: selectedUserProfileId.value } });
    }
  };

  return {
    isLoading,
    tagBackground,
    data,
    onClick,
    isAccreditationIsClickable,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAccreditationButton, import.meta.hot));
}
