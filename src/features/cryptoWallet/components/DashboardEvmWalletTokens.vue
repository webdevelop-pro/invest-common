<script setup lang="ts">
import { computed } from 'vue';
import { currency } from 'InvestCommon/helpers/currency';
import VWalletTokensAndTransactions from 'InvestCommon/shared/components/VWalletTokensAndTransactions.vue';
import VTableWalletTokensItem from './VTableWalletTokensItem.vue';
import VTableWalletTransactionsItem from './VTableWalletTransactionsItem.vue';
import env from 'InvestCommon/domain/config/env';
import { EvmTransactionTypes } from 'InvestCommon/data/evm/evm.types';
import { useDashboardEvmWalletTokens } from './logic/useDashboardEvmWalletTokens';

const props = defineProps({
  profileId: {
    type: Number,
    required: true,
  },
  loggedIn: {
    type: Boolean,
    required: true,
  },
  isError: Boolean,
});

const emit = defineEmits<{
  (e: 'click', type: EvmTransactionTypes): void,
}>();

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

const {
  getEvmWalletState,
  tableOptions,
  transactionsOptions,
  isShowIncomingBalance,
  isShowOutgoingBalance,
  isSkeleton,
  buttonConfigs,
  isLoadingNotificationTransaction,
  isLoadingNotificationWallet,
} = useDashboardEvmWalletTokens();

// Help TS resolve env property in template binding
const WALLET_SCAN_URL = (env as any).CRYPTO_WALLET_SCAN_URL as string;

const balances = computed(() => [
  {
    title: 'Wallet Balance:',
    balance: currency(getEvmWalletState.value.data?.currentBalance),
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
</script>

<template>
    <VWalletTokensAndTransactions
      :balances="balances"
      :tables="tables"
      :action-buttons="buttonConfigs"
      class="DashboardEvmWalletTokens dashboard-evm-wallet-tokens"
      @button-click="payload => payload.transactionType ? emit('click', payload.transactionType) : null"
    />
</template>

<style lang="scss">
.dashboard-evm-wallet-tokens {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1 0 0;
  background: $white;
  box-shadow: $box-shadow-medium;

  &__top {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 20px;
    align-self: stretch;
    border-radius: 2px;
    background: $primary-light;

    @media screen and (max-width: $tablet){
      flex-direction: column;
      align-items: flex-start;
    }
  }

  &__balance {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    flex: 1 0 0;
  }

  &__buttons {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: end;
    
    @media screen and (max-width: $tablet) {
      width: 100%;
      justify-content: flex-start;
    }
  }

  &__top-title {
    color: $gray-70;
  }

  &__balance-numbers {
    color: $gray-40;
  }

  &__balance-current {
    // color: $black;
    margin-right: 8px;
  }

  &__balance-incoming {
    color: $secondary-dark;
    margin-right: 8px;
  }

  &__balance-outcoming {
    color: $red;
    margin-left: 8px;
  }

  &__content {
    display: flex;
    padding: 20px;
    flex-direction: column;
    align-items: flex-start;
    align-self: stretch;
  }

  &__content-top {
    display: flex;
    padding-bottom: 8px;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    align-self: stretch;
    color: $gray-70;
  }

  &__button-icon {
    width: 16px;
  }

  .v-table-head:last-of-type {
    text-align: end;
  }
}
</style>
