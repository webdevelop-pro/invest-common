import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useRepositoryWallet } from 'InvestCommon/data/wallet/wallet.repository';
import { useRepositoryEvm } from 'InvestCommon/data/evm/evm.repository';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useDialogs } from 'InvestCommon/domain/dialogs/store/useDialogs';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { hasRestrictedWalletBehavior } from 'InvestCommon/data/profiles/profiles.helpers';
import type { IProfileFormatted } from 'InvestCommon/data/profiles/profiles.types';
import { useSettingsBankAccounts } from 'InvestCommon/features/settings/components/logic/useSettingsBankAccounts';
import { useWalletAuth } from 'InvestCommon/features/wallet/store/useWalletAuth';
import { useToast } from 'UiKit/components/Base/VToast/use-toast';
import { isWalletSetupRequiredError } from './walletSetupError';

const CONTACT_US_LINK =
  '<a href="#contact-us-dialog" class="is--link-1" data-action="contact-us">contact us</a>';
const CONTACT_US_MSG = `Unfortunately, we were not able to create a wallet for you. Please ${CONTACT_US_LINK} to resolve the issue.`;
const WALLET_CREATING_MSG = `This usually takes a few moments. If it takes longer than expected, ${CONTACT_US_LINK} for assistance.`;
const WALLET_SETUP_REQUIRED_TITLE = 'Set up your wallet to continue.';
const WALLET_SETUP_REQUIRED_MSG = 'Your crypto wallet has not been created yet. Start wallet setup to continue.';
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
  const dialogsStore = useDialogs();
  const profilesStore = useProfilesStore();
  const walletAuthStore = useWalletAuth();
  const sessionStore = useSessionStore();
  const { toast } = useToast();
  const {
    selectedUserProfileData,
    selectedUserProfileId,
    selectedUserProfileType,
  } = storeToRefs(profilesStore);
  const { userSessionTraits } = storeToRefs(sessionStore);
  const { getProfileByIdState } = storeToRefs(useRepositoryProfiles());
  const {
    getWalletState,
    createLinkExchangeState,
    createLinkProcessState,
  } = storeToRefs(useRepositoryWallet());
  const { getEvmWalletState } = storeToRefs(useRepositoryEvm());

  const handleBankAccountsUpdated = () => {
    toast({
      title: 'Bank account connected',
      description: 'Your bank account was successfully linked.',
      variant: 'success',
    });
  };

  const { onAddAccountClick, isLinkBankAccountLoading } = useSettingsBankAccounts({
    skipInitialUpdate: true,
    onBankAccountsUpdated: handleBankAccountsUpdated,
  });

  const profile = computed(
    () => (selectedUserProfileData.value ?? null) as IProfileFormatted | null,
  );
  const hasRestrictedWallet = computed(() => hasRestrictedWalletBehavior(profile.value));
  const isWalletCreationRequired = computed(() => {
    return isWalletSetupRequiredError(getEvmWalletState.value.error, {
      isKycApproved: profile.value?.isKycApproved ?? false,
      walletData: getEvmWalletState.value.data,
    });
  });

  const isFiatWalletError = computed(
    () => Boolean(getWalletState.value.data?.isWalletStatusAnyError ?? getWalletState.value.error),
  );
  const isEvmWalletError = computed(
    () => !isWalletCreationRequired.value
      && Boolean(getEvmWalletState.value.data?.isStatusAnyError ?? getEvmWalletState.value.error),
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
    const fiatCreated = getWalletState.value.data?.isWalletStatusCreated ?? false;
    if (hideFiatAlerts) {
      return false;
    }

    return fiatCreated && !isWalletError.value && !isWalletCreationRequired.value;
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
      !isWalletCreationRequired.value && (
        (profile.value?.isKycDeclined ?? false) ||
        isWalletError.value ||
        hasRestrictedWallet.value
      ),
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

  // 1) Any repository signaling an explicit loading state
  const isAnyRepoLoading = computed(
    () => getProfileByIdState.value.loading
      || getWalletState.value.loading
      || getEvmWalletState.value.loading
      || createLinkExchangeState.value.loading
      || createLinkProcessState.value.loading,
  );

  // 2) Fiat wallet is "empty but clean": no data, no error, not loading
  const isFiatWalletEmpty = computed(
    () => getWalletState.value.data === undefined
      && getWalletState.value.error === null
      && !getWalletState.value.loading,
  );

  // 3) EVM wallet is "empty but clean": no data, no error, not loading
  const isEvmWalletEmpty = computed(
    () => getEvmWalletState.value.data === undefined
      && getEvmWalletState.value.error === null
      && !getEvmWalletState.value.loading,
  );

  // 4) Both wallets are in their initial "empty but clean" state
  const areWalletsInitialLoading = computed(
    () => isFiatWalletEmpty.value && isEvmWalletEmpty.value && !isAlertShow.value,
  );

  // Final flag exposed to the UI
  const isDataLoading = computed(
    () => isAnyRepoLoading.value || areWalletsInitialLoading.value,
  );

  const isAlertShow = computed(
    () =>
      (hasRestrictedWallet.value ||
        isKYCNeedToPass.value ||
        isKYCInProgress.value ||
        isWalletCreationRequired.value ||
        isWalletCreated.value ||
        shouldShowBankAccountMissing.value ||
        isError.value),
  );

  /**
   * Wallet is considered "blocked" when we are showing an error-type alert
   * (e.g. KYC required, declined, or a hard wallet error). Setup-required and
   * informational states should remain actionable without dimming the wallet UI.
   */
  const isWalletBlocked = computed(
    () => isAlertShow.value && isAlertType.value === 'error',
  );
  const isAlertType = computed(() => {
    if (
      isWalletCreated.value
      || shouldShowBankAccountMissing.value
    ) {
      return 'info';
    }
    if (isError.value || isWalletCreationRequired.value) return 'error';
    return 'error';
  });
  const isAlertText = computed(() => {
    if (isError.value) return CONTACT_US_MSG;
    if (isWalletCreationRequired.value) return WALLET_SETUP_REQUIRED_MSG;
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
    if (isWalletCreationRequired.value) return WALLET_SETUP_REQUIRED_TITLE;
    if (isWalletCreated.value) return 'Your wallet is being created and verified.';
    return undefined;
  });
  const alertButtonText = computed(() =>
    isKYCNeedToPass.value
      ? 'Verify Identity'
      : isWalletCreationRequired.value
        ? 'Set Up Wallet'
        : undefined,
  );
  const alertModel = computed(() => ({
    show: isAlertShow.value,
    variant: isAlertType.value,
    title: alertTitle.value,
    description: isAlertText.value,
    buttonText: alertButtonText.value,
    isLoading: isLinkBankAccountLoading.value,
    isDisabled: isLinkBankAccountLoading.value,
  }));

  const showTable = computed(
    () =>
      !hasRestrictedWallet.value && !isError.value && !isWalletCreationRequired.value,
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
      return;
    }

    if (!isWalletCreationRequired.value) {
      return;
    }

    const profileId = Number(selectedUserProfileId.value);
    if (!profileId) {
      return;
    }

    void walletAuthStore.startFlowForProfile({
      profileId,
      isKycApproved: selectedUserProfileData.value?.isKycApproved,
      profileType: selectedUserProfileType.value,
      profileName: selectedUserProfileData.value?.name,
      fullAccountName: selectedUserProfileData.value?.data?.full_account_name,
      userEmail: userSessionTraits.value?.email,
      walletStatus: selectedUserProfileData.value?.wallet?.status,
    });
  };

  const onDescriptionAction = (event: Event) => {
    const target = event.target as HTMLElement | null;
    const currentTarget = event.currentTarget as HTMLElement | null;
    const bankAccountsLink = (target?.closest('a[href]') as HTMLAnchorElement | null)
      || (currentTarget?.querySelector('a[href*="bank-accounts"]') as HTMLAnchorElement | null);

    if (bankAccountsLink?.href?.includes('bank-accounts')) {
      event.preventDefault();
      event.stopPropagation();
      void onAddAccountClick();
      return;
    }

    const contactUsTarget = target?.closest('[data-action="contact-us"]')
      || currentTarget?.querySelector('[data-action="contact-us"]');
    if (!contactUsTarget) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    dialogsStore.openContactUsDialog('wallet');
  };

  return {
    alertModel,
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
    isLinkBankAccountLoading,
    onAlertButtonClick,
    onDescriptionAction,
    isDataLoading,
  };
}
