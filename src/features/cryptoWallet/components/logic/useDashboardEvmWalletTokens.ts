import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useRepositoryEvm } from 'InvestCommon/data/evm/evm.repository';

export const useDashboardEvmWalletTokens = () => {
  const evmRepository = useRepositoryEvm();
  const { getEvmWalletState } = storeToRefs(evmRepository);

  const tableOptions = computed(() => getEvmWalletState.value.data?.balances);

  const isShowIncomingBalance = computed(() => (
    (getEvmWalletState.value.data?.pending_incoming_balance ?? 0) > 0
  ));

  const isShowOutgoingBalance = computed(() => (
    (getEvmWalletState.value.data?.pending_outcoming_balance ?? 0) > 0
  ));

  const canWithdraw = computed(() => (
    getEvmWalletState.value.data?.balances.length > 0
  ));

  const isSkeleton = computed(() => (getEvmWalletState.value.loading));

  return {
    getEvmWalletState,
    tableOptions,
    isShowIncomingBalance,
    isShowOutgoingBalance,
    canWithdraw,
    isSkeleton,
  };
};


