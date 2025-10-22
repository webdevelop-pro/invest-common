import { computed, nextTick, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRepositoryEvm } from 'InvestCommon/data/evm/evm.repository';
import { useRepositoryWallet } from 'InvestCommon/data/wallet/wallet.repository';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import VTableWalletTokensItem from 'InvestCommon/features/cryptoWallet/components/VTableWalletTokensItem.vue';
import { currency } from 'InvestCommon/helpers/currency';
import { ROUTE_DASHBOARD_EVMWALLET, ROUTE_DASHBOARD_WALLET } from 'InvestCommon/domain/config/enums/routes';

export function useWalletData() {
  const evmRepository = useRepositoryEvm();
  const walletRepository = useRepositoryWallet();
  const profilesStore = useProfilesStore();
  
  const { selectedUserProfileId, selectedUserProfileData } = storeToRefs(profilesStore);
  const { getEvmWalletState, canLoadEvmWalletData } = storeToRefs(evmRepository);
  const { getWalletState, canLoadWalletData } = storeToRefs(walletRepository);

  const updateWalletData = async () => {
    if (canLoadWalletData.value && !getWalletState.value.loading && !getWalletState.value.error) {
      walletRepository.getWalletByProfile(selectedUserProfileId.value);
    } else {
      walletRepository.resetAll();
    }
  };

  const updateCryptoWalletData = async () => {
    if (canLoadEvmWalletData.value && !getEvmWalletState.value.loading && !getEvmWalletState.value.error) {
      evmRepository.getEvmWalletByProfile(selectedUserProfileId.value);
    } else {
      evmRepository.resetAll();
    }
  };
  watch(() => [selectedUserProfileData.value.id, selectedUserProfileData.value.kyc_status], () => {
    nextTick(() => {
      updateWalletData();
      updateCryptoWalletData();
    });
  }, { immediate: true });

  const walletTokensTop5 = computed(() => 
    (getEvmWalletState.value.data?.balances || [])
      .filter((b: any) => Number(b?.amount || 0) > 0)
      .slice(0, 5)
  );

  const walletTokensHeader = [
    { text: 'Icon' },
    { text: 'Name' },
    { text: 'Symbol' },
    { text: 'Amount' },
    { text: 'Network link' },
  ];

  const walletTokensTableRows = computed(() =>
    (walletTokensTop5?.value || [])
      .map((b: any) => ({
        name: String(b?.name || ''),
        amount: String(b?.amount ?? '0'),
        symbol: String(b?.symbol || ''),
        address: String(b?.address || ''),
        icon: b?.icon ? String(b.icon) : undefined,
      }))
  );

  const balances = computed(() => [
    {
      title: 'Crypto Wallet Balance:',
      balance: currency(getEvmWalletState.value.data?.fundingBalance),
      to: { name: ROUTE_DASHBOARD_EVMWALLET, params: { profileId: selectedUserProfileId.value } },
    },
    {
      title: 'Wallet Balance:',
      balance: currency(getWalletState?.value?.data?.currentBalance),
      to: { name: ROUTE_DASHBOARD_WALLET, params: { profileId: selectedUserProfileId.value } },
    },
  ]);

  const tables = computed(() => [
    {
      title: 'Tokens:',
      header: walletTokensHeader,
      data: walletTokensTableRows.value || [],
      loading: getEvmWalletState.value.loading,
      rowLength: 5,
      colspan: walletTokensHeader.length,
      tableRowComponent: VTableWalletTokensItem,
    },
  ]);

  return {
    getEvmWalletState,
    getWalletState,
    walletTokensTop5,
    walletTokensTableRows,
    balances,
    tables,
  };
}
