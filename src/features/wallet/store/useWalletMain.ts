import {
  computed, watch, nextTick,
} from 'vue';
import { storeToRefs } from 'pinia';
import { useRepositoryWallet } from 'InvestCommon/data/wallet/wallet.repository';
import { urlContactUs } from 'InvestCommon/global/links';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRouter } from 'vue-router';
import { PROFILE_TYPES } from 'InvestCommon/global/investment.json';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';

const FUNDING_TAB_INFO = {
  title: 'Wallet',
  text: `
      You can link a bank account in preparation for investing. This will simplify your
      investment process and will allow to invest more quickly. Enter the required information
      for your bank account, including the account number and routing number. You may also
      need to verify your ownership of the bank account by confirming small deposits made
      by the investment platform.
    `,
};

export function useWalletMain() {
  const router = useRouter();
  const userProfileStore = useProfilesStore();
  const { selectedUserProfileData, selectedUserProfileId } = storeToRefs(userProfileStore);
  const userSessionStore = useSessionStore();
  const { userLoggedIn } = storeToRefs(userSessionStore);
  const useRepositoryProfilesStore = useRepositoryProfiles();
  const { getProfileByIdState } = storeToRefs(useRepositoryProfilesStore);
  // Stores
  const walletRepository = useRepositoryWallet();
  const { getWalletState } = storeToRefs(walletRepository);

  // KYC and wallet status logic
  const kycStatus = computed(() => selectedUserProfileData.value?.kyc_status);
  const isKYCInProgress = computed(() => kycStatus.value && (kycStatus.value === 'in_progress'));
  const isKYCApproved = computed(() => kycStatus.value && (kycStatus.value === 'approved'));
  const isKYCAlert = computed(() => !isKYCApproved.value && !isKYCInProgress.value);
  const isKYCDeclined = computed(() => kycStatus.value && (kycStatus.value === 'declined'));
  const isWalletAlert = computed(() => getWalletState.value.data?.isWalletStatusAnyError || getWalletState.value.error);
  const isAlertInfo = computed(() => (
    (getWalletState.value.data?.isWalletStatusCreated || isKYCInProgress.value) && !isWalletAlert.value));
  const isAlertNotAble = computed(() => isWalletAlert.value || isKYCDeclined.value);
  const isAlertKYC = computed(() => (
    isKYCAlert.value && !isKYCDeclined.value && !isKYCInProgress.value && !isWalletAlert.value));

  const isAlertShow = computed(() => (
    (isAlertNotAble.value || isAlertInfo.value || isAlertKYC.value) && !getProfileByIdState.value.loading
  ));

  const isTopTextShow = computed(() => (
    !isWalletAlert.value && !isKYCDeclined.value
  ));

  const isAlertType = computed(() => {
    if (isAlertInfo.value) return 'info';
    return 'error';
  });

  const isAlertText = computed(() => {
    if (isAlertNotAble.value) {
      return `Unfortunately, we were not able to create a wallet for you. Please <a href="${urlContactUs}">contact us</a>\n    to resolve the issue.`;
    }
    if (isAlertInfo.value) {
      return `This usually takes a few moments. If \n    it takes longer than expected, <a href="${urlContactUs}">contact us</a> for assistance.`;
    }
    if (isAlertKYC.value) return `You need to <a href="/profile/${selectedUserProfileId.value}/kyc">pass KYC </a>\n    before you can make a transfer`;
    return undefined;
  });

  const alertTitle = computed(() => {
    if (isAlertKYC.value) return 'Identity verification is needed. ';
    if (isAlertInfo.value) return 'Your wallet is being created and verified.';
    return undefined;
  });

  const alertButtonText = computed(() => {
    if (isAlertKYC.value) return 'Verify Identity';
    return undefined;
  });

  const selectedIdAsDataIs = computed(() => selectedUserProfileData.value.id === selectedUserProfileId.value);
  const isSdira = computed(() => (selectedUserProfileData.value.type === PROFILE_TYPES.SDIRA));
  const canLoadWalletData = computed(() => (
    !isSdira.value && selectedIdAsDataIs.value && userLoggedIn.value
    && !isKYCAlert.value && (selectedUserProfileId.value > 0)));

  const updateData = async () => {
    if (canLoadWalletData.value && !getWalletState.value.loading && (selectedUserProfileId.value > 0)) {
      await walletRepository.getWalletByProfile(selectedUserProfileId.value);
    }
  };

  const onAlertButtonClick = () => {
    if (isKYCAlert.value) {
      router.push({ name: 'ROUTE_SUBMIT_KYC', params: { profileId: selectedUserProfileId.value } });
    }
  };

  watch(() => [selectedUserProfileData.value.id, isKYCAlert.value], () => {
    nextTick(() => {
      if (canLoadWalletData.value) updateData();
    });
  });

  return {
    // State
    selectedUserProfileData,
    selectedUserProfileId,
    userLoggedIn,
    // Computed
    kycStatus,
    isKYCAlert,
    isKYCDeclined,
    isWalletAlert,
    isAlertShow,
    isTopTextShow,
    isAlertType,
    isAlertText,
    alertTitle,
    alertButtonText,
    canLoadWalletData,
    isSdira,
    // Action
    updateData,
    onAlertButtonClick,
    getWalletState,
    FUNDING_TAB_INFO,
  };
}
