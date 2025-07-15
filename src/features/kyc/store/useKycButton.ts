import {
  ref, computed,
  watch,
} from 'vue';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { InvestKycTypes } from 'InvestCommon/types/api/invest';
import { KycTextStatuses } from 'InvestCommon/data/kyc/kyc.types';
import { useRouter } from 'vue-router';
import { ROUTE_SUBMIT_KYC } from 'InvestCommon/helpers/enums/routes';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { urlContactUs } from 'InvestCommon/global/links';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRepositoryKyc } from 'InvestCommon/data/kyc/kyc.repository';

export const useKycButton = defineStore('useKycButton', () => {
  const router = useRouter();

  const userProfilesStore = useProfilesStore();
  const {
    selectedUserProfileData, selectedUserProfileId, isSelectedProfileLoading, selectedUserProfileShowKycInitForm,
  } = storeToRefs(userProfilesStore);
  const userSessionStore = useSessionStore();
  const { userLoggedIn } = storeToRefs(userSessionStore);
  const useRepositoryKycStore = useRepositoryKyc();
  const { isPlaidLoading } = storeToRefs(useRepositoryKycStore);

  /* * Loading State * */
  const isLoading = ref(true);

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

  const handleKycClick = async () => {
    if (selectedUserProfileShowKycInitForm.value) {
      void router.push({
        name: ROUTE_SUBMIT_KYC,
        params: { profileId: selectedUserProfileId.value },
      });
    } else {
      await useRepositoryKycStore.handlePlaidKyc();
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
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useKycButton, import.meta.hot));
}
