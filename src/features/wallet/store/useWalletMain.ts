import {
  computed, watch, nextTick,
} from 'vue';
import { defineStore, storeToRefs, acceptHMRUpdate } from 'pinia';
import { useRepositoryWallet } from 'InvestCommon/data/wallet/wallet.repository';
import { urlContactUs } from 'InvestCommon/global/links';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRouter } from 'vue-router';
import { PROFILE_TYPES } from 'InvestCommon/global/investment.json';

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

export const useWalletMain = defineStore('useWalletMain', () => {
  const router = useRouter();
  const userProfileStore = useProfilesStore();
  const { selectedUserProfileData, selectedUserProfileId } = storeToRefs(userProfileStore);
  const userSessionStore = useSessionStore();
  const { userLoggedIn } = storeToRefs(userSessionStore);
  // Stores
  const walletRepository = useRepositoryWallet();
  const { getWalletState } = storeToRefs(walletRepository);

  // KYC and wallet status logic
  const kycStatus = computed(() => selectedUserProfileData.value?.kyc_status);
  const isKYCAlert = computed(() => kycStatus.value && (kycStatus.value !== 'approved'));
  const isKYCDeclined = computed(() => kycStatus.value && (kycStatus.value === 'declined'));
  const isWalletAlert = computed(() => getWalletState.value.data?.isWalletStatusAnyError);

  const isAlertShow = computed(() => (
    isKYCAlert.value || isWalletAlert.value || isKYCDeclined.value || getWalletState.value.data?.isWalletStatusCreated
  ));

  const isTopTextShow = computed(() => (
    !isWalletAlert.value && !isKYCDeclined.value
  ));

  const isAlertType = computed(() => {
    if (getWalletState.value.data?.isWalletStatusCreated) return 'info';
    return 'error';
  });

  const isAlertText = computed(() => {
    if (isWalletAlert.value || isKYCDeclined.value) {
      return `Unfortunately, we were not able to create a wallet for you. Please <a href="${urlContactUs}">contact us</a>\n    to resolve the issue.`;
    }
    if (getWalletState.value.data?.isWalletStatusCreated) {
      return `This usually takes a few moments. If \n    it takes longer than expected, <a href="${urlContactUs}">contact us</a> for assistance.`;
    }
    return `You need to <a href="/profile/${selectedUserProfileId.value}/kyc">pass KYC </a>\n    before you can make a transfer`;
  });

  const alertTitle = computed(() => {
    if (isKYCAlert.value && !isKYCDeclined.value) return 'Identity verification is needed. ';
    if (getWalletState.value.data?.isWalletStatusCreated) return 'Your wallet is being created and verified.';
    return undefined;
  });

  const alertButtonText = computed(() => {
    if (isWalletAlert.value) return undefined;
    if (isKYCDeclined.value) return undefined;
    if (getWalletState.value.data?.isWalletStatusCreated) return undefined;
    return 'Verify Identity';
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
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useWalletMain, import.meta.hot));
}
