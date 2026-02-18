import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useRepositoryWallet } from 'InvestCommon/data/wallet/wallet.repository';
import { useRepositoryEvm } from 'InvestCommon/data/evm/evm.repository';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { hasRestrictedWalletBehavior } from '../helpers/walletProfileHelpers';
import type { IProfileFormatted } from 'InvestCommon/data/profiles/profiles.types';

const CONTACT_US_LINK =
  '<a href="#contact-us-dialog" class="is--link-1" data-action="contact-us">contact us</a>';
const CONTACT_US_MSG = `Unfortunately, we were not able to create a wallet for you. Please ${CONTACT_US_LINK} to resolve the issue.`;
const WALLET_CREATING_MSG = `This usually takes a few moments. If it takes longer than expected, ${CONTACT_US_LINK} for assistance.`;
const KYC_NEED_MSG = (profileId: string | number, redirect?: string) => {
  const baseHref = `/profile/${profileId}/kyc`;
  const href =
    typeof redirect === 'string' && redirect
      ? `${baseHref}?redirect=${encodeURIComponent(redirect)}`
      : baseHref;
  return `You need to <a href="${href}">pass KYC </a> before you can make a transfer`;
};
const KYC_IN_PROGRESS_MSG =
  'Your KYC is in progress. You need to pass KYC before you can make a transfer';
const BANK_ACCOUNTS_NEED_MSG = (profileId: string | number) =>
  `You need to <a href="/settings/${profileId}/bank-accounts">connect a bank account</a> before you can add funds.`;

export interface UseWalletAlertOptions {
  /** When true, do not show alerts related to fiat wallet (e.g. bank account, fiat wallet status). Use for crypto-only contexts like Earn. */
  hideFiatAlerts?: boolean;
  /**
   * When true, suppress the "connect a bank account" info alert while still
   * showing other fiat-related alerts (KYC, wallet creation, errors).
   * Useful on the Settings → Bank Accounts tab where the "add bank account"
   * message would be redundant.
   */
  hideBankAccountMissingInfo?: boolean;
}

/** Shared KYC + wallet alert state for both fiat and crypto wallet. */
export function useWalletAlert(options: UseWalletAlertOptions = {}) {
  const { hideFiatAlerts = false, hideBankAccountMissingInfo = false } = options;

  const router = useRouter();
  const route = useRoute();
  const profilesStore = useProfilesStore();
  const { selectedUserProfileData, selectedUserProfileId } = storeToRefs(profilesStore);
  const { getProfileByIdState } = storeToRefs(useRepositoryProfiles());
  const {
    getWalletState,
    canLoadWalletData,
    createLinkExchangeState,
    createLinkProcessState,
  } = storeToRefs(useRepositoryWallet());
  const { getEvmWalletState, canLoadEvmWalletData } = storeToRefs(useRepositoryEvm());

  const profile = computed(
    () => (selectedUserProfileData.value ?? null) as IProfileFormatted | null,
  );
  const hasRestrictedWallet = computed(() => hasRestrictedWalletBehavior(profile.value));

  const isFiatWalletError = computed(
    () => getWalletState.value.data?.isWalletStatusAnyError ?? getWalletState.value.error,
  );
  const isEvmWalletError = computed(
    () => getEvmWalletState.value.data?.isStatusAnyError ?? getEvmWalletState.value.error,
  );
  const isWalletError = computed(
    () =>
      hideFiatAlerts
        ? isEvmWalletError.value
        : isFiatWalletError.value || isEvmWalletError.value,
  );

  const hasLinkedBankAccount = computed(
    () => getWalletState.value.data?.isSomeLinkedBankAccount ?? false,
  );

  const isWalletCreated = computed(() => {
    const evmCreated = getEvmWalletState.value.data?.isStatusCreated ?? false;
    const fiatCreated = getWalletState.value.data?.isWalletStatusCreated ?? false;
    const created = hideFiatAlerts ? evmCreated : fiatCreated || evmCreated;
    return created && !isWalletError.value;
  });

  const isKYCNeedToPass = computed(
    () =>
      (profile.value?.isKycNone || profile.value?.isKycNew || profile.value?.isKycPending) &&
      !isWalletError.value,
  );
  const isKYCInProgress = computed(
    () => (profile.value?.isKycInProgress ?? false) && !isWalletError.value,
  );
  const isError = computed(
    () =>
      (profile.value?.isKycDeclined ?? false) ||
      isWalletError.value ||
      hasRestrictedWallet.value,
  );

  const isKycPassed = computed(
    () =>
      (profile.value?.isKycApproved ?? false) ||
      (!isKYCNeedToPass.value &&
        !isKYCInProgress.value &&
        !(profile.value?.isKycDeclined ?? false)),
  );

  const hasWallet = computed(
    () => (getWalletState.value.data?.id ?? 0) > 0 && !isWalletError.value,
  );

  const isBankAccountMissing = computed(
    () =>
      !hideFiatAlerts &&
      hasWallet.value &&
      isKycPassed.value &&
      !hasLinkedBankAccount.value &&
      !isWalletError.value,
  );

  // Some contexts (like the Settings → Bank Accounts tab) should not show the
  // "connect a bank account" info alert, even though other fiat alerts are
  // still desired. This computed flag lets us filter that specific case out.
  const shouldShowBankAccountMissing = computed(
    () => isBankAccountMissing.value && !hideBankAccountMissingInfo,
  );

  const isDataLoading = computed(() => {
    const profileLoading = getProfileByIdState.value.loading;
    const walletLoading = getWalletState.value.loading;
    const evmLoading = getEvmWalletState.value.loading;
    const exchangeLoading = createLinkExchangeState.value.loading;
    const processLoading = createLinkProcessState.value.loading;

    // Any explicit loading flag → show alert skeleton
    if (profileLoading || walletLoading || evmLoading || exchangeLoading || processLoading) {
      return true;
    }

    // Initial "no data yet" states, but only when those wallets are actually
    // allowed to load (e.g. KYC passed, feature enabled). If canLoad* is false,
    // we should not treat missing data as "loading".
    const needsFiatInitialLoad =
      getWalletState.value.data === undefined &&
      canLoadWalletData.value &&
      getWalletState.value.error === null;

    const needsEvmInitialLoad =
      getEvmWalletState.value.data === undefined &&
      canLoadEvmWalletData.value &&
      getEvmWalletState.value.error === null;

    // Only show the alert skeleton while BOTH fiat and EVM are in their
    // initial "can load but no data yet" state. As soon as we either
    // (a) have data for one side, or (b) cannot load it (e.g. KYC required),
    // we stop showing the loading skeleton.
    if (needsFiatInitialLoad && needsEvmInitialLoad) {
      return true;
    }

    return false;
  });

  const isAlertShow = computed(
    () =>
      !isDataLoading.value &&
      (hasRestrictedWallet.value ||
        isKYCNeedToPass.value ||
        isKYCInProgress.value ||
        isWalletCreated.value ||
        shouldShowBankAccountMissing.value ||
        isError.value),
  );

  /**
   * Wallet is considered "blocked" when we are showing an error-type alert
   * (e.g. KYC required, declined, or any wallet error). This is used by the
   * Wallet tab to visually dim/disable the main wallet UI while the problem
   * alert is visible.
   */
  const isWalletBlocked = computed(
    () => isAlertShow.value && isAlertType.value === 'error',
  );
  const isAlertType = computed(() => {
    if (isError.value) return 'error';
    if (isWalletCreated.value || shouldShowBankAccountMissing.value) return 'info';
    return 'error';
  });
  const isAlertText = computed(() => {
    if (isError.value) return CONTACT_US_MSG;
    if (isWalletCreated.value) return WALLET_CREATING_MSG;
    if (isKYCNeedToPass.value) {
      return KYC_NEED_MSG(selectedUserProfileId.value, route.fullPath);
    }
    if (isKYCInProgress.value) return KYC_IN_PROGRESS_MSG;
    if (shouldShowBankAccountMissing.value) {
      return BANK_ACCOUNTS_NEED_MSG(selectedUserProfileId.value);
    }
    return CONTACT_US_MSG;
  });
  const alertTitle = computed(() => {
    if (isKYCNeedToPass.value) return 'Identity verification is needed. ';
    if (isWalletCreated.value) return 'Your wallet is being created and verified.';
    return undefined;
  });
  const alertButtonText = computed(() =>
    isKYCNeedToPass.value ? 'Verify Identity' : undefined,
  );

  const showTable = computed(
    () =>
      !hasRestrictedWallet.value && !isError.value,
  );
  const isTopTextShow = computed(
    () =>
      !hasRestrictedWallet.value &&
      !isWalletError.value &&
      !selectedUserProfileData.value?.isKycDeclined,
  );

  const onAlertButtonClick = () => {
    if (isKYCNeedToPass.value) {
      const redirect = route.fullPath;
      router.push({
        name: 'ROUTE_SUBMIT_KYC',
        params: { profileId: selectedUserProfileId.value },
        query: { redirect },
      });
    }
  };

  return {
    hasRestrictedWallet,
    isKYCNeedToPass,
    isKYCInProgress,
    isError,
    isAlertShow,
    isAlertType,
    isAlertText,
    isTopTextShow,
    isWalletBlocked,
    alertTitle,
    showTable,
    alertButtonText,
    onAlertButtonClick,
    isDataLoading,
  };
}
