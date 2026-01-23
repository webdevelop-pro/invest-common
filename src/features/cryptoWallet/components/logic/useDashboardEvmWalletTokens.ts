import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter, useRoute } from 'vue-router';
import { useRepositoryEvm } from 'InvestCommon/data/evm/evm.repository';
import { EvmTransactionTypes } from 'InvestCommon/data/evm/evm.types';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { hasRestrictedWalletBehavior } from 'InvestCommon/features/wallet/helpers/walletProfileHelpers';
import type { IProfileFormatted } from 'InvestCommon/data/profiles/profiles.types';
import { currency } from 'InvestCommon/helpers/currency';
import env from 'InvestCommon/domain/config/env';
import { ROUTE_DASHBOARD_EARN } from 'InvestCommon/domain/config/enums/routes';
import VTableWalletTokensItem from '../VTableWalletTokensItem.vue';
import VTableWalletTransactionsItem from '../VTableWalletTransactionsItem.vue';
import addFunds from 'InvestCommon/shared/assets/images/icons/add-funds.svg';
import withdraw from 'InvestCommon/shared/assets/images/icons/withdraw.svg';
import exchange from 'InvestCommon/shared/assets/images/icons/exchange.svg';
import buy from 'InvestCommon/shared/assets/images/icons/buy.svg';
import earn from 'InvestCommon/shared/assets/images/icons/earn.svg';

const transactionsTableHeader = [
  { text: 'Date' },
  { text: 'Token' },
  { text: 'Amount' },
  { text: 'Investment ID' },
  { text: 'Status' },
  { text: 'Transaction TX/Network' },
];

const balanceTableHeader = [
  { text: 'Icon' },
  { text: 'Name' },
  { text: 'Symbol' },
  { text: 'Amount' },
  { text: 'Network link' },
];

// Help TS resolve env property in template binding
const WALLET_SCAN_URL = env.CRYPTO_WALLET_SCAN_URL as string;

export const useDashboardEvmWalletTokens = (
  props: { isError?: boolean } = {},
  emit?: (e: 'click', type: EvmTransactionTypes) => void
) => {
  const router = useRouter();
  const route = useRoute();
  const evmRepository = useRepositoryEvm();
  const {
    getEvmWalletState, isLoadingNotificationTransaction, isLoadingNotificationWallet,
  } = storeToRefs(evmRepository);
  
  const profilesStore = useProfilesStore();
  const { selectedUserProfileData, selectedUserProfileId } = storeToRefs(profilesStore);

  const tableOptions = computed(() => getEvmWalletState.value.data?.balances);

  const isShowIncomingBalance = computed(() => (
    (getEvmWalletState.value.data?.pendingIncomingBalance ?? 0) > 0
  ));

  const isShowOutgoingBalance = computed(() => (
    (getEvmWalletState.value.data?.pendingOutcomingBalance ?? 0) > 0
  ));

  const hasRestrictedWallet = computed(() => 
    hasRestrictedWalletBehavior((selectedUserProfileData.value ?? null) as IProfileFormatted | null)
  );

  const isWalletReady = computed(() => {
    const walletData = getEvmWalletState.value.data;
    return !getEvmWalletState.value.loading
      && !getEvmWalletState.value.error
      && !props.isError
      && walletData
      && (walletData.isStatusCreated || walletData.isStatusVerified)
      && !walletData.isStatusAnyError;
  });

  const canAddFunds = computed(() => (
    isWalletReady.value
    && !hasRestrictedWallet.value
    && selectedUserProfileData.value.isKycApproved
  ));

  const hasAvailableBalances = computed(() => {
    const balances = getEvmWalletState.value.data?.balances || [];
    return balances.some(balance => (Number(balance.amount) || 0) > 0);
  });

  const canWithdraw = computed(() => (
    isWalletReady.value
    && hasAvailableBalances.value
  ));

  const canExchange = computed(() => (
    isWalletReady.value
    && hasAvailableBalances.value
  ));

  const canNavigateToEarn = computed(() => (
    isWalletReady.value
    && !hasRestrictedWallet.value
    && selectedUserProfileData.value.isKycApproved
  ));

  const canBuy = computed(() => (
    isWalletReady.value
    && !hasRestrictedWallet.value
    && selectedUserProfileData.value.isKycApproved
  ));

  const isSkeleton = computed(() => getEvmWalletState.value.loading);

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
      disabled: !canAddFunds.value,
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
      disabled: !canBuy.value,
      transactionType: null,
    },
    {
      id: 'earn',
      label: 'Earn',
      variant: 'outlined',
      icon: earn,
      disabled: !canNavigateToEarn.value,
      transactionType: null,
    },
  ]);

  const balances = computed(() => [
    {
      title: 'Wallet Balance:',
      balance: currency(getEvmWalletState.value.data?.fundingBalance),
      href: `${WALLET_SCAN_URL}/address/${getEvmWalletState.value.data?.address}`,
    },
    ...(isShowIncomingBalance.value ? [{
      title: 'Incoming:',
      balance: `+ ${currency(getEvmWalletState.value.data?.pendingIncomingBalance)}`,
      label: 'Pending',
    }] : []),
    ...(isShowOutgoingBalance.value ? [{
      title: 'Outgoing:',
      balance: `- ${currency(getEvmWalletState.value.data?.pendingOutcomingBalance)}`,
      label: 'Pending investment',
    }] : []),
  ]);

  const tables = computed(() => [
    {
      title: 'Tokens:',
      header: balanceTableHeader,
      data: tableOptions.value || [],
      loading: (isSkeleton.value && !props.isError) || isLoadingNotificationWallet.value,
      rowLength: 5,
      colspan: balanceTableHeader.length,
      tableRowComponent: VTableWalletTokensItem,
    },
    {
      title: 'Latest Transactions:',
      viewAllHref: '#',
      header: transactionsTableHeader,
      data: transactionsOptions.value || [],
      loading: (isSkeleton.value && !props.isError) || isLoadingNotificationTransaction.value,
      rowLength: 5,
      colspan: transactionsTableHeader.length,
      tableRowComponent: VTableWalletTransactionsItem,
    },
  ]);

  const handleButtonClick = (payload: { id: string | number, transactionType?: unknown }) => {
    if (payload.id === 'earn') {
      if (route.name === ROUTE_DASHBOARD_EARN) {
        // Clear all query parameters by replacing the URL without query params
        const url = new URL(window.location.href);
        url.search = '';
        window.history.replaceState({}, '', url.toString());
        // Trigger router update by replacing with current route but empty query
        router.replace({
          path: route.path,
          query: {},
        });
      } else {
        router.push({ 
          name: ROUTE_DASHBOARD_EARN, 
          params: { profileId: selectedUserProfileId.value },
          query: {},
        });
      }
    } else if (payload.transactionType && emit) {
      emit('click', payload.transactionType as EvmTransactionTypes);
    }
  };

  return {
    balances,
    tables,
    buttonConfigs,
    handleButtonClick,
    tableOptions,
    isShowIncomingBalance,
    isShowOutgoingBalance,
    canWithdraw,
    isSkeleton,
  };
};


