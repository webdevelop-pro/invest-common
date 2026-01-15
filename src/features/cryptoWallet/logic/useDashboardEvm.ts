import {
  computed,
  nextTick,
  onBeforeMount,
  ref,
  watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { urlContactUs } from 'InvestCommon/domain/config/links';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryEvm } from 'InvestCommon/data/evm/evm.repository';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { EvmTransactionTypes } from 'InvestCommon/data/evm/evm.types';
import { hasRestrictedWalletBehavior } from 'InvestCommon/features/wallet/helpers/walletProfileHelpers';

export const EVM_WALLET_TAB_INFO = {
  title: 'Crypto Wallet',
  text: `
    Modern, simple, user-friendly "hot wallet" for managing your REAL WORLD ASSETS. It allows you to not only send, receive, and store RWA tokens but also to beautifully display and manage your crypto portfolio. Its real power lies in its ability to connect to world assets and interact directly with other marketplaces, decentralized finance (DeFi) platforms for swapping tokens or earning yield. In essence, we simplifies the complex process DeFI and TradeFI into a clean interface, making it easy for anyone to securely navigate the decentralized web
  `,
};

export function useDashboardEvm() {
  const router = useRouter();
  const route = useRoute();

  const profilesStore = useProfilesStore();
  const { selectedUserProfileId, selectedUserProfileData } = storeToRefs(profilesStore);

  const userSessionStore = useSessionStore();
  const { userLoggedIn } = storeToRefs(userSessionStore);

  const useRepositoryProfilesStore = useRepositoryProfiles();
  const { getProfileByIdState } = storeToRefs(useRepositoryProfilesStore);

  const evmRepository = useRepositoryEvm();
  const { getEvmWalletState, canLoadEvmWalletData } = storeToRefs(evmRepository);

  // KYC and wallet status logic
  const isWalletError = computed(() => getEvmWalletState.value.data?.isStatusAnyError || getEvmWalletState.value.error);

  const isKYCNeedToPass = computed(() => ((
    selectedUserProfileData.value.isKycNone || selectedUserProfileData.value.isKycNew
    || selectedUserProfileData.value.isKycPending) && !isWalletError.value));

  const isKYCInProgress = computed(() => (
    selectedUserProfileData.value.isKycInProgress && !isWalletError.value));

  const isWalletCreated = computed(() => (
    getEvmWalletState.value.data?.isStatusCreated && !isWalletError.value));

  const hasRestrictedWallet = computed(() => hasRestrictedWalletBehavior(selectedUserProfileData.value));
  const isError = computed(() => (
    selectedUserProfileData.value.isKycDeclined || isWalletError.value || hasRestrictedWallet.value));

  const isAlertShow = computed(() => (
    hasRestrictedWallet.value
    || (isKYCNeedToPass.value || isKYCInProgress.value || isError.value)
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
    if (isWalletCreated.value) return 'info' as const;
    return 'error' as const;
  });

  const isAlertText = computed(() => {
    if (isError.value) {
      return `Unfortunately, we were not able to create a wallet for you. Please <a href="${urlContactUs}">contact us</a>\n    to resolve the issue.`;
    }
    if (isWalletCreated.value) {
      return `This usually takes a few moments. If \n    it takes longer than expected, <a href="${urlContactUs}">contact us</a> for assistance.`;
    }
    if (isKYCNeedToPass.value) return `You need to <a href="/profile/${selectedUserProfileId.value}/kyc">pass KYC </a>\n    before you can make a transfer`;
    if (isKYCInProgress.value) return 'Your KYC is in progress. You need to pass KYC before you can make a transfer';
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
    if (canLoadEvmWalletData.value && !getEvmWalletState.value.loading && !getEvmWalletState.value.error) {
      await evmRepository.getEvmWalletByProfile(selectedUserProfileId.value);
    } else if (!canLoadEvmWalletData.value && getEvmWalletState.value.data ){
      evmRepository.resetAll();
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

  onBeforeMount(() => {
    updateData();
  });

  const isDialogTransactionOpen = ref(false);
  const transactiontType = ref<EvmTransactionTypes>(EvmTransactionTypes.deposit);

  // Initialize transaction type from URL query before dialog parses it
  const initTransactionTypeFromQuery = () => {
    const queryVal = route.query['add-transaction'];
    const value = Array.isArray(queryVal) ? queryVal[0] : queryVal;
    if (
      value === EvmTransactionTypes.withdrawal
      || value === EvmTransactionTypes.deposit
      || value === EvmTransactionTypes.exchange
    ) {
      transactiontType.value = value as EvmTransactionTypes;
      isDialogTransactionOpen.value = true;
    }
  };

  initTransactionTypeFromQuery();

  const onTransactionClick = (type: EvmTransactionTypes) => {
    transactiontType.value = type;
    isDialogTransactionOpen.value = true;
  };

  return {
    // state from stores
    selectedUserProfileId,
    selectedUserProfileData,
    userLoggedIn,

    // repository state
    getEvmWalletState,

    // ui constants
    EVM_WALLET_TAB_INFO,

    // computed for UI
    isWalletError,
    isAlertShow,
    isTopTextShow,
    isAlertType,
    isAlertText,
    alertTitle,
    alertButtonText,
    showWalletTable,

    // actions
    onAlertButtonClick,
    onTransactionClick,

    // dialog state
    isDialogTransactionOpen,
    transactiontType,
  };
}

export default useDashboardEvm;


