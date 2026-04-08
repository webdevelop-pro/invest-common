import {
  computed, effectScope, nextTick, watch, unref, type EffectScope,
} from 'vue';
import { storeToRefs } from 'pinia';
import { useRepositoryWallet } from 'InvestCommon/data/wallet/wallet.repository';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryEvm } from 'InvestCommon/data/evm/evm.repository';
import { useRepositoryEarn } from 'InvestCommon/data/earn/earn.repository';
import { reportError } from 'InvestCommon/domain/error/errorReporting';
import { currency } from 'UiKit/helpers/currency';
import {
  canLoadWalletData as canLoadWalletDataRule,
  canLoadEvmWalletData as canLoadEvmWalletDataRule,
} from './walletLoadRules';
import { isWalletSetupRequiredError } from './walletSetupError';

let walletEffectsScope: EffectScope | null = null;

/** Single composable for the combined Wallet page (fiat + crypto). One call runs both. */
export function useWallet() {
  const profilesStore = useProfilesStore();
  const { selectedUserProfileData, selectedUserProfileId } = storeToRefs(profilesStore);
  const { userLoggedIn } = storeToRefs(useSessionStore());
  const walletRepository = useRepositoryWallet();
  const { getWalletState } = storeToRefs(walletRepository);
  const evmRepository = useRepositoryEvm();
  const earnRepository = useRepositoryEarn();
  const { getEvmWalletState } = storeToRefs(evmRepository);

  const canLoadWalletData = computed(() => canLoadWalletDataRule(
    selectedUserProfileData.value,
    selectedUserProfileId.value,
    userLoggedIn.value,
    getWalletState.value.loading,
  ));
  const canLoadEvmWalletData = computed(() => canLoadEvmWalletDataRule(
    selectedUserProfileData.value,
    selectedUserProfileId.value,
    userLoggedIn.value,
    getEvmWalletState.value.loading,
  ));

  const fiatBalance = computed(() => getWalletState.value.data?.currentBalance ?? 0);
  const fiatBalanceMain = computed(() => Math.floor(fiatBalance.value));
  const fiatBalanceMainFormatted = computed(() => currency(fiatBalanceMain.value, 0));
  const fiatBalanceCoins = computed(() => (fiatBalance.value - fiatBalanceMain.value).toFixed(2).substring(1));
  const fiatPendingDeposit = computed(
    () => getWalletState.value.data?.pendingIncomingBalanceFormatted,
  );
  const fiatPendingWithdraw = computed(
    () => getWalletState.value.data?.pendingOutcomingBalanceFormatted,
  );

  const cryptoBalance = computed(() => getEvmWalletState.value.data?.fundingBalance ?? 0);
  const cryptoBalanceMain = computed(() => Math.floor(cryptoBalance.value));
  const cryptoBalanceMainFormatted = computed(() => currency(cryptoBalanceMain.value, 0));
  const cryptoBalanceCoins = computed(() => (cryptoBalance.value - cryptoBalanceMain.value).toFixed(2).substring(1));
  // Formatted 24h change for crypto; undefined when backend doesn't provide it
  const crypto24hChange = computed(
    () => getEvmWalletState.value.data?.cryptoChangeFormatted,
  );

  const rwaValue = computed(() => getEvmWalletState.value.data?.rwaValue ?? 0);
  const rwaValueMain = computed(() => Math.floor(rwaValue.value));
  const rwaValueMainFormatted = computed(() => currency(rwaValueMain.value, 0));
  const rwaValueCoins = computed(() => (rwaValue.value - rwaValueMain.value).toFixed(2).substring(1));
  // Formatted value change for RWA; undefined when backend doesn't provide it
  const rwa24hChange = computed(
    () => getEvmWalletState.value.data?.rwaChangeFormatted,
  );

  const totalBalance = computed(
    () => fiatBalance.value + cryptoBalance.value + rwaValue.value,
  );
  const totalBalanceMain = computed(() => Math.floor(totalBalance.value));
  const totalBalanceMainFormatted = computed(() => currency(totalBalanceMain.value, 0));
  const totalBalanceCoins = computed(() => (totalBalance.value - totalBalanceMain.value).toFixed(2).substring(1));

  const hasFiatWalletData = computed(() => !!getWalletState.value.data);
  const hasEvmWalletData = computed(() => !!getEvmWalletState.value.data);

  const isWalletDataLoading = computed(() => {
    // Explicit loading flags from repositories
    if (getWalletState.value.loading || getEvmWalletState.value.loading) {
      return true;
    }

    // Initial blank state: neither fiat nor EVM data has loaded yet,
    // but both are allowed to load and have no errors.
    const needsFiatInitialLoad =
      !hasFiatWalletData.value &&
      canLoadWalletData.value &&
      !getWalletState.value.error;

    const needsEvmInitialLoad =
      !hasEvmWalletData.value &&
      canLoadEvmWalletData.value &&
      !getEvmWalletState.value.error;

    // Show the top-level skeleton only while *both* sides are still in their
    // initial "no data yet" state. As soon as we have wallet data for either
    // fiat or crypto, we stop showing the global skeleton.
    if (needsFiatInitialLoad && needsEvmInitialLoad) {
      return true;
    }

    return false;
  });

  const updateWalletData = async () => {
    if (canLoadWalletData.value && !getWalletState.value.loading && !getWalletState.value.error) {
      try {
        await walletRepository.getWalletByProfile(selectedUserProfileId.value);
      } catch (e) {
        reportError(e, 'Failed to fetch wallet');
      }
    } else if (!canLoadWalletData.value && getWalletState.value.data) {
      walletRepository.resetAll();
    }
  };

  const updateCryptoWalletData = async () => {
    if (canLoadEvmWalletData.value && !getEvmWalletState.value.loading && !getEvmWalletState.value.error) {
      try {
        await evmRepository.getEvmWalletByProfile(
          selectedUserProfileId.value,
          unref(earnRepository.positionsPools) ?? [],
        );
      } catch (e) {
        if (isWalletSetupRequiredError(e, {
          isKycApproved: selectedUserProfileData.value?.isKycApproved ?? false,
          walletData: getEvmWalletState.value.data,
        })) {
          return;
        }

        reportError(e, 'Failed to fetch EVM wallet');
      }
    } else if (!canLoadEvmWalletData.value && getEvmWalletState.value.data) {
      evmRepository.resetAll();
    }
  };

  const updateData = async () => {
    updateWalletData();
    updateCryptoWalletData();
  };

  // Keep the profile-driven wallet refresh alive for the lifetime of the app.
  // A detached effect scope avoids tying the watcher to the first component that used this composable.
  if (!walletEffectsScope) {
    walletEffectsScope = effectScope(true);
    walletEffectsScope.run(() => {
      watch(
        () => [selectedUserProfileData.value?.id, selectedUserProfileData.value?.kyc_status],
        () => {
          void nextTick(() => updateData());
        },
        { immediate: true },
      );
    });
  }

  return {
    // Raw states for consumers that need full access
    getWalletState,
    getEvmWalletState,

    // Derived balances
    fiatBalance,
    fiatBalanceMain,
    fiatBalanceCoins,
    fiatBalanceMainFormatted,
    fiatPendingDeposit,
    fiatPendingWithdraw,
    cryptoBalance,
    cryptoBalanceMain,
    cryptoBalanceCoins,
    cryptoBalanceMainFormatted,
    crypto24hChange,
    rwaValue,
    rwaValueMain,
    rwaValueCoins,
    rwaValueMainFormatted,
    rwa24hChange,
    totalBalance,
    totalBalanceMain,
    totalBalanceCoins,
    totalBalanceMainFormatted,

    // Controls
    updateData,
    isWalletDataLoading,
  };
}
