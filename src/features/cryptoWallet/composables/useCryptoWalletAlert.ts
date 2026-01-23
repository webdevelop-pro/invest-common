import { computed, onBeforeMount, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRepositoryEvm } from 'InvestCommon/data/evm/evm.repository';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { hasRestrictedWalletBehavior } from 'InvestCommon/features/wallet/helpers/walletProfileHelpers';
import type { IProfileFormatted } from 'InvestCommon/data/profiles/profiles.types';

export function useCryptoWalletAlert() {
  const router = useRouter();

  const profilesStore = useProfilesStore();
  const { selectedUserProfileId, selectedUserProfileData } = storeToRefs(profilesStore);

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

  const hasRestrictedWallet = computed(() => 
    hasRestrictedWalletBehavior((selectedUserProfileData.value ?? null) as IProfileFormatted | null)
  );
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

  const showTable = computed(() => (
    !isAlertShow.value
    && !hasRestrictedWallet.value
    && !isWalletError.value
  ));

  const isAlertType = computed(() => {
    if (isWalletCreated.value) return 'info' as const;
    return 'error' as const;
  });

  const isAlertText = computed(() => {
    if (isError.value) {
      return `Unfortunately, we were not able to create a wallet for you. Please <a href="#contact-us-dialog" class="is--link-1" data-action="contact-us">contact us</a>\n    to resolve the issue.`;
    }
    if (isWalletCreated.value) {
      return `This usually takes a few moments. If \n    it takes longer than expected, <a href="#contact-us-dialog" class="is--link-1" data-action="contact-us">contact us</a> for assistance.`;
    }
    if (isKYCNeedToPass.value) return `You need to <a href="/profile/${selectedUserProfileId.value}/kyc">pass KYC </a>\n    before you can make a transfer`;
    if (isKYCInProgress.value) return 'Your KYC is in progress. You need to pass KYC before you can make a transfer';
    return `Unfortunately, we were not able to create a wallet for you. Please <a href="#contact-us-dialog" class="is--link-1" data-action="contact-us">contact us</a>\n    to resolve the issue.`;
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
    } else if (!canLoadEvmWalletData.value && getEvmWalletState.value.data) {
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

  return {
    isAlertShow,
    isTopTextShow,
    showTable,
    isAlertType,
    isAlertText,
    alertTitle,
    alertButtonText,
    onAlertButtonClick,
  };
}
