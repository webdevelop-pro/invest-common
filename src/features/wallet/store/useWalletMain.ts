import { computed, watch, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import { useRepositoryWallet } from 'InvestCommon/data/wallet/wallet.repository';
import { urlContactUs } from 'InvestCommon/domain/config/links';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRouter } from 'vue-router';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { hasRestrictedWalletBehavior } from '../helpers/walletProfileHelpers';

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
  const { getWalletState, canLoadWalletData } = storeToRefs(walletRepository);

  // KYC and wallet status logic
  const isWalletError = computed(() => getWalletState.value.data?.isWalletStatusAnyError || getWalletState.value.error);
  const isKYCNeedToPass = computed(() => ((
    selectedUserProfileData.value.isKycNone || selectedUserProfileData.value.isKycNew
    || selectedUserProfileData.value.isKycPending) && !isWalletError.value));
  const isKYCInProgress = computed(() => (
    selectedUserProfileData.value.isKycInProgress && !isWalletError.value));
  const isWalletCreated = computed(() => (
    getWalletState.value.data?.isWalletStatusCreated && !isWalletError.value));
  const hasRestrictedWallet = computed(() => hasRestrictedWalletBehavior(selectedUserProfileData.value));
  const isError = computed(() => (
    selectedUserProfileData.value.isKycDeclined || isWalletError.value || hasRestrictedWallet.value));

  const isAlertShow = computed(() => (
    hasRestrictedWallet.value
    || (isKYCNeedToPass.value || isKYCInProgress.value || isWalletCreated.value || isError.value)
    && !getProfileByIdState.value.loading
  ));

  const isTopTextShow = computed(() => (
    !hasRestrictedWallet.value
    && !isWalletError.value && !selectedUserProfileData.value.isKycDeclined
  ));
  
  const showWalletTable = computed(() => (
    !hasRestrictedWallet.value
    && !isWalletError.value
  ));

  const isAlertType = computed(() => {
    if (isWalletCreated.value) return 'info';
    return 'error';
  });

  const isAlertText = computed(() => {
    if (isError.value) {
      return `Unfortunately, we were not able to create a wallet for you. Please <a href="${urlContactUs}">contact us</a>\n    to resolve the issue.`;
    }
    if (isWalletCreated.value) {
      return `This usually takes a few moments. If \n    it takes longer than expected, <a href="${urlContactUs}">contact us</a> for assistance.`;
    }
    if (isKYCNeedToPass.value) return `You need to <a href="/profile/${selectedUserProfileId.value}/kyc">pass KYC </a>\n    before you can make a transfer`;
    if (isKYCInProgress.value) return `Your KYC is in progress. You need to pass KYC before you can make a transfer`;
    return `Unfortunately, we were not able to create a wallet for you. Please <a href="${urlContactUs}">contact us</a>\n    to resolve the issue.`;
  });

  const alertTitle = computed(() => {
    if (isKYCNeedToPass.value) return 'Identity verification is needed. ';
    if (isWalletCreated.value) return 'Your wallet is being created and verified.';
    return undefined;
  });

  const alertButtonText = computed(() => {
    if (isKYCNeedToPass.value) return 'Verify Identity';
    return undefined;
  });

  const updateData = async () => {
    if (canLoadWalletData.value && !getWalletState.value.loading && !getWalletState.value.error) {
      await walletRepository.getWalletByProfile(selectedUserProfileId.value);
    } else if (!canLoadWalletData.value && getWalletState.value.data ){
      walletRepository.resetAll();
    }
  };

  const onAlertButtonClick = () => {
    if (isKYCNeedToPass.value) {
      router.push({ name: 'ROUTE_SUBMIT_KYC', params: { profileId: selectedUserProfileId.value } });
    }
  };

  watch(() => [selectedUserProfileData.value.id, selectedUserProfileData.value.kyc_status], () => {
    nextTick(() => {
      updateData();
    });
  });

  return {
    // State
    selectedUserProfileData,
    selectedUserProfileId,
    userLoggedIn,
    // Computed
    isWalletError,
    isKYCNeedToPass,
    isKYCInProgress,
    isWalletCreated,
    isError,
    isAlertShow,
    isTopTextShow,
    isAlertType,
    isAlertText,
    alertTitle,
    alertButtonText,
    canLoadWalletData,
    showWalletTable,
    // Action
    updateData,
    onAlertButtonClick,
    getWalletState,
    FUNDING_TAB_INFO,
  };
}
