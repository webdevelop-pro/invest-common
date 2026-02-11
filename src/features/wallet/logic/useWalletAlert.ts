import { computed } from 'vue';
import { useRouter } from 'vue-router';
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
const KYC_NEED_MSG = (profileId: string | number) =>
  `You need to <a href="/profile/${profileId}/kyc">pass KYC </a> before you can make a transfer`;
const KYC_IN_PROGRESS_MSG =
  'Your KYC is in progress. You need to pass KYC before you can make a transfer';
const BANK_ACCOUNTS_NEED_MSG = (profileId: string | number) =>
  `You need to <a href="/settings/${profileId}/bank-accounts">connect a bank account</a> before you can add funds`;

/** Shared KYC + wallet alert state for both fiat and crypto wallet. */
export function useWalletAlert() {
  const router = useRouter();
  const profilesStore = useProfilesStore();
  const { selectedUserProfileData, selectedUserProfileId } = storeToRefs(profilesStore);
  const { getProfileByIdState } = storeToRefs(useRepositoryProfiles());
  const { getWalletState } = storeToRefs(useRepositoryWallet());
  const { getEvmWalletState } = storeToRefs(useRepositoryEvm());

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
    () => isFiatWalletError.value || isEvmWalletError.value,
  );

  const hasLinkedBankAccount = computed(
    () => getWalletState.value.data?.isSomeLinkedBankAccount ?? false,
  );

  const isWalletCreated = computed(
    () =>
      (getWalletState.value.data?.isWalletStatusCreated ||
        getEvmWalletState.value.data?.isStatusCreated) &&
      !isWalletError.value,
  );

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

  const isBankAccountMissing = computed(
    () => isKycPassed.value && !hasLinkedBankAccount.value && !isWalletError.value,
  );

  const isAlertShow = computed(
    () =>
      (hasRestrictedWallet.value ||
        isKYCNeedToPass.value ||
        isKYCInProgress.value ||
        isWalletCreated.value ||
        isBankAccountMissing.value ||
        isError.value) &&
      !getProfileByIdState.value.loading,
  );
  const isAlertType = computed(() =>
    isWalletCreated.value || isBankAccountMissing.value ? 'info' : 'error',
  );
  const isAlertText = computed(() => {
    if (isError.value) return CONTACT_US_MSG;
    if (isWalletCreated.value) return WALLET_CREATING_MSG;
    if (isKYCNeedToPass.value) return KYC_NEED_MSG(selectedUserProfileId.value);
    if (isKYCInProgress.value) return KYC_IN_PROGRESS_MSG;
    if (isBankAccountMissing.value) {
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
      router.push({
        name: 'ROUTE_SUBMIT_KYC',
        params: { profileId: selectedUserProfileId.value },
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
    alertTitle,
    showTable,
    alertButtonText,
    onAlertButtonClick,
  };
}
