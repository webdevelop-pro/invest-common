import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRepositoryWallet } from 'InvestCommon/data/wallet/wallet.repository';
import { loadPlaidScriptOnce, type PlaidHandler } from 'InvestCommon/data/plaid/loadPlaidScriptOnce';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import type { IProfileFormatted } from 'InvestCommon/data/profiles/profiles.types';
import type { IFundingSourceDataFormatted } from 'InvestCommon/data/wallet/wallet.types';
import { useWallet } from 'InvestCommon/features/wallet/logic/useWallet';

let plaidHandler: PlaidHandler | null = null;
let expectedLinkSessionId: string | null = null;

const SKELETON_ITEM_COUNT = 2;
const PLAID_OPEN_DELAY_MS = 1000;

export interface UseSettingsBankAccountsOptions {
  /**
   * When true, skip the initial wallet fetch on mount.
   * This is useful when reusing only the Plaid \"Add Bank Account\" flow
   * outside of the Settings page (e.g. wallet alert), to avoid extra fetches.
   */
  skipInitialUpdate?: boolean;
}

export function useSettingsBankAccounts(options: UseSettingsBankAccountsOptions = {}) {
  const { selectedUserProfileData } = storeToRefs(useProfilesStore());
  const walletRepository = useRepositoryWallet();
  const { updateData } = useWallet();
  const {
    getWalletState,
    deleteLinkedAccountState,
    walletId,
    createLinkExchangeState,
    createLinkTokenState,
  } = storeToRefs(walletRepository);

  const profile = computed<IProfileFormatted | null | undefined>(
    () => selectedUserProfileData.value as IProfileFormatted | null | undefined,
  );
  const profileId = computed(() => profile.value?.id ?? 0);
  const fundingSource = computed<IFundingSourceDataFormatted[]>(
    () => getWalletState.value.data?.funding_source ?? [],
  );

  const isWalletAnyError = computed(
    () => getWalletState.value.data?.isWalletStatusAnyError || getWalletState.value.error,
  );
  const isCanAddBankAccount = computed(
    () =>
      walletId.value > 0 &&
      !!profile.value?.isKycApproved &&
      !isWalletAnyError.value &&
      !getWalletState.value.data?.isWalletStatusCreated,
  );
  const isLinkBankAccountLoading = ref(false);
  const isLoading = computed(() => getWalletState.value.loading);
  const showSkeletonPlaceholders = computed(
    () => isLoading.value && fundingSource.value.length === 0,
  );

  onMounted(() => {
    if (!options.skipInitialUpdate && profileId.value > 0) {
      void updateData();
    }
  });

  async function onDeleteAccountClick(sourceId: string | number) {
    if (deleteLinkedAccountState.value.loading || profileId.value <= 0) return;
    await walletRepository.deleteLinkedAccount(profileId.value, {
      funding_source_id: String(sourceId),
    });
    await updateData();
  }

  async function plaidOnLinkSuccess(publicToken: string) {
    if (!createLinkExchangeState.value.loading) {
      await walletRepository.createLinkExchange(profileId.value, { public_token: publicToken });
    }
    const { data } = createLinkExchangeState.value;
    if (!createLinkExchangeState.value.error && data?.accounts?.length) {
      const promises = data.accounts.map(
        (account: { account_id?: string; name?: string; mask?: string }) =>
          walletRepository.createLinkProcess(profileId.value, {
            access_token: data.access_token,
            account_id: account.account_id,
            name: account.name,
            last4: account.mask,
          }),
      );
      await Promise.all(promises);
    }
    await updateData();
  }

  async function onAddAccountClick() {
    isLinkBankAccountLoading.value = true;
    try {
      if (!createLinkTokenState.value.data?.link_token) {
        await walletRepository.createLinkToken(profileId.value);
      }
      const { data, error } = createLinkTokenState.value;
      if (error || !data?.link_token) {
        isLinkBankAccountLoading.value = false;
        return;
      }

      await loadPlaidScriptOnce();
      expectedLinkSessionId = null;
      plaidHandler = window?.Plaid.create({
        token: data.link_token,
        onSuccess: async (publicToken: string, metadata: { link_session_id?: string }) => {
          if (expectedLinkSessionId && metadata?.link_session_id !== expectedLinkSessionId) return;
          await plaidOnLinkSuccess(publicToken);
          isLinkBankAccountLoading.value = false;
        },
        onLoad: () => {
          isLinkBankAccountLoading.value = false;
        },
        onExit: () => {
          isLinkBankAccountLoading.value = false;
        },
        onEvent: (eventName: string, metadata: { link_session_id?: string }) => {
          if (!expectedLinkSessionId && metadata?.link_session_id) {
            expectedLinkSessionId = metadata.link_session_id;
          }
          // As soon as the Plaid Link UI opens (and shows its own loader),
          // hide our local loading spinner.
          if (eventName === 'OPEN') {
            isLinkBankAccountLoading.value = false;
          }
        },
        receivedRedirectUri: null,
      });
      setTimeout(() => plaidHandler?.open(), PLAID_OPEN_DELAY_MS);
    } catch (e) {
      console.error(e);
      isLinkBankAccountLoading.value = false;
    }
  }

  return {
    fundingSource,
    isCanAddBankAccount,
    isLinkBankAccountLoading,
    deleteLinkedAccountState,
    onAddAccountClick,
    onDeleteAccountClick,
    showSkeletonPlaceholders,
    skeletonItemCount: SKELETON_ITEM_COUNT,
  };
}

