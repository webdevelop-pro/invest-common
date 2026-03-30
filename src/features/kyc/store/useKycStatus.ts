import {
  ref, computed,
  watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { InvestKycTypes, KycAlerts, KycTextStatuses } from 'InvestCommon/data/kyc/kyc.types';
import { ROUTE_SUBMIT_KYC } from 'InvestCommon/domain/config/enums/routes';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { urlContactUs } from 'InvestCommon/domain/config/links';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRepositoryKyc } from 'InvestCommon/data/kyc/kyc.repository';
import { PROFILE_TYPES } from 'InvestCommon/domain/config/enums/profileTypes';
import { useDialogs } from 'InvestCommon/domain/dialogs/store/useDialogs';

export const useKycStatus = defineStore('useKycStatus', () => {
  const route = useRoute();
  const router = useRouter();
  const dialogsStore = useDialogs();
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
  const isPlaidLoadingAfter = computed(() => (
    isPlaidLoading.value || (isPlaidDone.value && selectedUserProfileData.value.isKycPending)));

  // Show skeleton only while profile data is being fetched (or while Plaid is actively loading),
  // not indefinitely after Plaid completes.
  const showSkeleton = computed(() => isLoading.value || isPlaidLoadingAfter.value);

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

  const dataAlert = computed(() => {
    const status = kycStatus.value;
    return {
      ...KycAlerts[status],
      buttonText: KycTextStatuses[status].button ? KycTextStatuses[status].text : undefined,
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
      const redirect = route.fullPath;
      try {
        await router.push({
          name: ROUTE_SUBMIT_KYC,
          params: { profileId: kycProfileId.value },
          query: {
            ...route.query,
            redirect,
          },
        });
        return;
      } catch {
        // Fallback to basic KYC route without redirect if navigation fails
        await router.push({
          name: ROUTE_SUBMIT_KYC,
          params: { profileId: kycProfileId.value },
        });
        return;
      }
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
    isButtonLoading,
    isButtonDisabled,
    showContactUs,
    isPlaidDone,
    showSkeleton,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useKycStatus, import.meta.hot));
}
