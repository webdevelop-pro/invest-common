import {
  ref, computed,
  watch,
} from 'vue';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { InvestKycTypes } from 'InvestCommon/types/api/invest';
import { KycTextStatuses } from 'InvestCommon/data/kyc/kyc.types';
import { ROUTE_SUBMIT_KYC } from 'InvestCommon/domain/config/enums/routes';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { urlContactUs, urlProfileKYC } from 'InvestCommon/domain/config/links';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRepositoryKyc } from 'InvestCommon/data/kyc/kyc.repository';
import { PROFILE_TYPES } from 'InvestCommon/domain/config/enums/profileTypes';

export const useKycButton = defineStore('useKycButton', () => {
  const userProfilesStore = useProfilesStore();
  const {
    selectedUserProfileData, selectedUserProfileId, isSelectedProfileLoading, selectedUserProfileShowKycInitForm,
    selectedUserProfileType, selectedUserIndividualProfile,
  } = storeToRefs(userProfilesStore);
  const userSessionStore = useSessionStore();
  const { userLoggedIn } = storeToRefs(userSessionStore);
  const useRepositoryKycStore = useRepositoryKyc();
  const { isPlaidLoading, isPlaidDone } = storeToRefs(useRepositoryKycStore);

  /* * Loading State * */
  const isLoading = ref(true);

  // const showSkeleton = computed(() => isLoading.value || (isPlaidDone.value && selectedUserProfileData.value?.isTypeIndividual));
  const showSkeleton = computed(() => isLoading.value || (isPlaidDone.value));

  // Watch for notification changes to update loading state
  watch([selectedUserProfileData, isSelectedProfileLoading], () => {
    isLoading.value = !selectedUserProfileData.value && isSelectedProfileLoading.value;
  }, { immediate: true });

  // Memoized KYC status for better performance
  const kycStatus = computed(() => selectedUserProfileData.value?.kyc_status || InvestKycTypes.none);

  const data = computed(() => {
    const status = kycStatus.value;
    return {
      ...KycTextStatuses[status],
      to: {
        name: ROUTE_SUBMIT_KYC,
        params: { profileId: selectedUserProfileId.value },
      },
      contactUsUrl: urlContactUs,
    };
  });

  const tagBackground = computed(() => {
    const statusClass = data.value.class;
    switch (statusClass) {
      case 'success':
        return 'secondary';
      case 'failed':
        return 'red';
      default:
        return 'yellow';
    }
  });

  const isButtonLoading = computed(() => isPlaidLoading.value);
  const isButtonDisabled = computed(() => isPlaidLoading.value);

  const isKycStatusDeclined = computed(() => kycStatus.value === InvestKycTypes.declined);
  const showContactUs = computed(() => isKycStatusDeclined.value);

  const isProfileAktAsIndividual = computed(() => (
    (selectedUserProfileType.value === PROFILE_TYPES.SDIRA)
    || (selectedUserProfileType.value === PROFILE_TYPES.SOLO401K)
  ));

  const kycProfileId = computed(() => {
    if (isProfileAktAsIndividual.value) {
      return selectedUserIndividualProfile.value?.id || selectedUserProfileId.value;
    }
    return selectedUserProfileId.value;
  });

  const handleKycClick = async () => {
    if (selectedUserProfileShowKycInitForm.value) {
      const to = urlProfileKYC(kycProfileId.value);
      window.location.href = to;
    } else {
      await useRepositoryKycStore.handlePlaidKyc(kycProfileId.value);
    }
  };

  const onClick = async () => {
    if (!userLoggedIn.value || !selectedUserProfileId.value) {
      return;
    }
    await handleKycClick();
  };

  return {
    isLoading,
    tagBackground,
    data,
    onClick,
    isButtonLoading,
    isButtonDisabled,
    showContactUs,
    isPlaidDone,
    showSkeleton,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useKycButton, import.meta.hot));
}
