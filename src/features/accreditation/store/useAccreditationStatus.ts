import {
  ref, computed,
  watch,
} from 'vue';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { AccreditationTypes, AccreditationTextStatuses, AccreditationAlerts } from 'InvestCommon/data/accreditation/accreditation.types';
import { useRouter } from 'vue-router';
import { ROUTE_ACCREDITATION_UPLOAD, ROUTE_DASHBOARD_PERSONAL_DETAILS } from 'InvestCommon/domain/config/enums/routes';
import { useDialogs } from 'InvestCommon/domain/dialogs/store/useDialogs';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { PROFILE_TYPES } from 'InvestCommon/domain/config/enums/profileTypes';

export const useAccreditationStatus = defineStore('useAccreditationStatus', () => {
  const router = useRouter();
  const dialogsStore = useDialogs();
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

  const status = computed(() => (
    selectedUserProfileData.value?.accreditation_status
      ? selectedUserProfileData.value?.accreditation_status
      : AccreditationTypes.new
  ));

  const to = computed(() => ({
    name: ROUTE_ACCREDITATION_UPLOAD,
    params: { profileId: selectedUserProfileId.value },
  }));

  const data = computed(() => ({
    ...AccreditationTextStatuses[status.value],
    to: to.value,
  }));

  const dataAlert = computed(() => ({
    ...AccreditationAlerts[status.value],
    to: to.value,
  }));

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
    await userProfileStore.setSelectedUserProfileById(accreditationProfileId.value);
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

  const onAlertDescriptionClick = (event: Event) => {
    const target = event.target as HTMLElement | null;
    const contactTarget = target?.closest('[data-action="contact-us"]');

    if (!contactTarget) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    dialogsStore.openContactUsDialog('dashboard verification');
  };

  return {
    isLoading,
    tagBackground,
    data,
    dataAlert,
    onClick,
    onAlertDescriptionClick,
    isAccreditationIsClickable,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAccreditationStatus, import.meta.hot));
}
