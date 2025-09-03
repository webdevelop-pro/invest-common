import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useRepositoryEvm } from 'InvestCommon/data/evm/evm.repository';
import { EvmTransactionTypes } from 'InvestCommon/data/evm/evm.types';
import addFunds from 'InvestCommon/shared/assets/images/icons/add-funds.svg';
import withdraw from 'InvestCommon/shared/assets/images/icons/withdraw.svg';
import exchange from 'InvestCommon/shared/assets/images/icons/exchange.svg';
import buy from 'InvestCommon/shared/assets/images/icons/buy.svg';
import earn from 'InvestCommon/shared/assets/images/icons/earn.svg';

export const useDashboardEvmWalletTokens = () => {
  const evmRepository = useRepositoryEvm();
  const { getEvmWalletState } = storeToRefs(evmRepository);

  const tableOptions = computed(() => getEvmWalletState.value.data?.balances);

  const isShowIncomingBalance = computed(() => (
    (getEvmWalletState.value.data?.pendingIncomingBalance ?? 0) > 0
  ));

  const isShowOutgoingBalance = computed(() => (
    (getEvmWalletState.value.data?.pendingOutcomingBalance ?? 0) > 0
  ));

  const canWithdraw = computed(() => (
    (getEvmWalletState.value.data?.balances?.length ?? 0) > 0
  ));

  const canExchange = computed(() => (
    (getEvmWalletState.value.data?.balances?.length ?? 0) > 0
  ));

  const isSkeleton = computed(() => (getEvmWalletState.value.loading));

  const transactionsOptions = computed(() => {
    const transactions = getEvmWalletState.value.data?.formattedTransactions || [];
    return transactions
      .slice()
      .sort((a, b) => (b.id || 0) - (a.id || 0))
      .slice(0, 5);
  });

  const buttonConfigs = computed(() => [
    {
      id: 'add-funds',
      label: 'Add Funds',
      variant: 'default',
      icon: addFunds,
      disabled: getEvmWalletState.value.loading,
      transactionType: EvmTransactionTypes.deposit,
    },
    {
      id: 'withdraw',
      label: 'Withdraw',
      variant: 'outlined',
      icon: withdraw,
      disabled: !canWithdraw.value,
      transactionType: EvmTransactionTypes.withdrawal,
    },
    {
      id: 'exchange',
      label: 'Exchange',
      variant: 'outlined',
      icon: exchange,
      disabled: !canExchange.value,
      transactionType: EvmTransactionTypes.exchange,
    },
    {
      id: 'buy',
      label: 'Buy',
      variant: 'outlined',
      icon: buy,
      disabled:  getEvmWalletState.value.loading,
      transactionType: null,
    },
    {
      id: 'earn',
      label: 'Earn',
      variant: 'outlined',
      icon: earn,
      disabled:  getEvmWalletState.value.loading,
      transactionType: null,
    },
  ]);

  return {
    getEvmWalletState,
    tableOptions,
    transactionsOptions,
    isShowIncomingBalance,
    isShowOutgoingBalance,
    canWithdraw,
    canExchange,
    isSkeleton,
    buttonConfigs,
  };
};


