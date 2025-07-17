import {
  ref, computed,
  watch,
} from 'vue';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { AccreditationTypes } from 'InvestCommon/types/api/invest';
import { AccreditationTextStatuses } from 'InvestCommon/data/accreditation/accreditation.types';
import { useRouter } from 'vue-router';
import { ROUTE_ACCREDITATION_UPLOAD, ROUTE_DASHBOARD_PERSONAL_DETAILS } from 'InvestCommon/helpers/enums/routes';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { PROFILE_TYPES } from 'InvestCommon/global/investment.json';

export const useAccreditationButton = defineStore('useAccreditationButton', () => {
  const router = useRouter();
  const userProfileStore = useProfilesStore();
  const {
    selectedUserProfileData, selectedUserProfileId, isSelectedProfileLoading, isTrustRevocable,
    selectedUserIndividualProfile, selectedUserProfileType,
  } = storeToRefs(userProfileStore);
  const userSessionStore = useSessionStore();
  const { userLoggedIn } = storeToRefs(userSessionStore);

  /* * Loading State * */
  const isLoading = ref(true);

  // Watch for notification changes to update loading state
  watch([selectedUserProfileData, isSelectedProfileLoading], () => {
    isLoading.value = !selectedUserProfileData.value && isSelectedProfileLoading.value;
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

  const isProfileAktAsIndividual = computed(() => (
    (selectedUserProfileType.value === PROFILE_TYPES.SDIRA)
    || (selectedUserProfileType.value === PROFILE_TYPES.SOLO401K)
    || isTrustRevocable.value
  ));

  const accreditationProfileId = computed(() => {
    if (isProfileAktAsIndividual.value) {
      return selectedUserIndividualProfile.value?.id || selectedUserProfileId.value;
    }
    return selectedUserProfileId.value;
  });

  const onClick = async () => {
    if (!userLoggedIn.value || !isAccreditationIsClickable.value || !selectedUserProfileId.value) {
      return;
    }
    if (!selectedUserProfileData.value?.escrow_id) {
      router.push({
        name: ROUTE_DASHBOARD_PERSONAL_DETAILS,
        params: { profileId: accreditationProfileId.value },
        query: { accreditation: true },
      });
    } else {
      router.push({ name: ROUTE_ACCREDITATION_UPLOAD, params: { profileId: accreditationProfileId.value } });
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
