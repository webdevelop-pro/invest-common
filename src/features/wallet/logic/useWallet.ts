import { computed, nextTick, onBeforeMount, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRepositoryWallet } from 'InvestCommon/data/wallet/wallet.repository';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRepositoryEvm } from 'InvestCommon/data/evm/evm.repository';
import { currency } from 'InvestCommon/helpers/currency';

let walletWatchersInitialized = false;

function formatBalanceParts(value: number): { main: number; mainFormatted: string; coins: string } {
  const main = Math.floor(value);
  const coins = (value - main).toFixed(2).toString().substring(1);
  return {
    main,
    mainFormatted: currency(main, 0),
    coins,
  };
}

/** Single composable for the combined Wallet page (fiat + crypto). One call runs both. */
export function useWallet() {
  const profilesStore = useProfilesStore();
  const { selectedUserProfileData, selectedUserProfileId } = storeToRefs(profilesStore);
  const walletRepository = useRepositoryWallet();
  const { getWalletState, canLoadWalletData } = storeToRefs(walletRepository);
  const evmRepository = useRepositoryEvm();
  const { getEvmWalletState, canLoadEvmWalletData } = storeToRefs(evmRepository);

  const fiatBalance = computed(() => getWalletState.value.data?.currentBalance ?? 0);
  const fiatParts = computed(() => formatBalanceParts(fiatBalance.value));
  const fiatBalanceMainFormatted = computed(() => fiatParts.value.mainFormatted);
  const fiatBalanceCoins = computed(() => fiatParts.value.coins);
  const fiatPendingDeposit = computed(
    () => getWalletState.value.data?.pendingIncomingBalanceFormatted,
  );
  const fiatPendingWithdraw = computed(
    () => getWalletState.value.data?.pendingOutcomingBalanceFormatted,
  );

  const cryptoBalance = computed(() => getEvmWalletState.value.data?.fundingBalance ?? 0);
  const cryptoParts = computed(() => formatBalanceParts(cryptoBalance.value));
  const cryptoBalanceMainFormatted = computed(() => cryptoParts.value.mainFormatted);
  const cryptoBalanceCoins = computed(() => cryptoParts.value.coins);
  // Formatted 24h change for crypto; undefined when backend doesn't provide it
  const crypto24hChange = computed(
    () => getEvmWalletState.value.data?.cryptoChangeFormatted,
  );

  const rwaValue = computed(() => getEvmWalletState.value.data?.rwaValue ?? 0);
  const rwaParts = computed(() => formatBalanceParts(rwaValue.value));
  const rwaValueMainFormatted = computed(() => rwaParts.value.mainFormatted);
  const rwaValueCoins = computed(() => rwaParts.value.coins);
  // Formatted value change for RWA; undefined when backend doesn't provide it
  const rwa24hChange = computed(
    () => getEvmWalletState.value.data?.rwaChangeFormatted,
  );

  const totalBalance = computed(
    () => fiatBalance.value + cryptoBalance.value + rwaValue.value,
  );
  const totalParts = computed(() => formatBalanceParts(totalBalance.value));
  const totalBalanceMainFormatted = computed(() => totalParts.value.mainFormatted);
  const totalBalanceCoins = computed(() => totalParts.value.coins);

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
      await walletRepository.getWalletByProfile(selectedUserProfileId.value);
    } else if (!canLoadWalletData.value && getWalletState.value.data) {
      walletRepository.resetAll();
    }
  };

  const updateCryptoWalletData = async () => {
    if (canLoadEvmWalletData.value && !getEvmWalletState.value.loading && !getEvmWalletState.value.error) {
      await evmRepository.getEvmWalletByProfile(selectedUserProfileId.value);
    } else if (!canLoadEvmWalletData.value && getEvmWalletState.value.data) {
      evmRepository.resetAll();
    }
  };

  const updateData = async () => {
    updateWalletData();
    updateCryptoWalletData();
  };

  // Ensure we only attach watchers & initial fetch once across the app,
  // even if `useWallet` is called from multiple composables/pages.
  if (!walletWatchersInitialized) {
    walletWatchersInitialized = true;
    watch(
      () => [selectedUserProfileData.value?.id, selectedUserProfileData.value?.kyc_status],
      () => nextTick(updateData),
    );
    onBeforeMount(() => updateData());
  }

  return {
    // Raw states for consumers that need full access
    getWalletState,
    getEvmWalletState,

    // Derived balances
    fiatBalance,
    fiatBalanceMain: computed(() => fiatParts.value.main),
    fiatBalanceCoins,
    fiatBalanceMainFormatted,
    fiatPendingDeposit,
    fiatPendingWithdraw,
    cryptoBalance,
    cryptoBalanceMain: computed(() => cryptoParts.value.main),
    cryptoBalanceCoins,
    cryptoBalanceMainFormatted,
    crypto24hChange,
    rwaValue,
    rwaValueMain: computed(() => rwaParts.value.main),
    rwaValueCoins,
    rwaValueMainFormatted,
    rwa24hChange,
    totalBalance,
    totalBalanceMain: computed(() => totalParts.value.main),
    totalBalanceCoins,
    totalBalanceMainFormatted,

    // Controls
    updateData,
    isWalletDataLoading,
  };
}
