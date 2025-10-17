<script setup lang="ts">
import { computed, defineAsyncComponent, watch } from 'vue';
import { currency } from 'InvestCommon/helpers/currency';
import plus from 'UiKit/assets/images/plus.svg';
import VWalletTokensAndTransactions from 'InvestCommon/shared/components/VWalletTokensAndTransactions.vue';
import VTableWalletTransactionsItem from './components/VTableWalletTransactionsItem.vue';
import { useWalletTransactions } from './store/useWalletTransactions';

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

const walletTransactions = useWalletTransactions();
const {
  isDialogAddTransactionOpen,
  addTransactiontTransactionType,
  isShowIncomingBalance,
  isShowOutgoingBalance,
  isSkeleton,
  isCanWithdraw,
  isCanLoadFunds,
  walletData,
  getTransactionsState,
  onWithdrawClick,
  onAddFundsClick,
  setProfileContext,
} = walletTransactions;

watch(() => [props.profileId, props.loggedIn], ([newProfileId, newLoggedIn]) => {
  setProfileContext(Number(newProfileId), Boolean(newLoggedIn));
}, { immediate: true });

const VDialogWalletAddTransaction = defineAsyncComponent({
  loader: () => import('./components/VDialogWalletAddTransaction.vue'),
});

const actionButtons = computed(() => [
  {
    id: 'add-funds',
    label: 'Add Funds',
    variant: 'default',
    icon: plus,
    disabled: !isCanLoadFunds.value,
  },
  {
    id: 'withdraw',
    label: 'Withdraw',
    variant: 'outlined',
    disabled: !isCanWithdraw.value,
  },
]);

const balances = computed(() => [
  {
    title: 'Wallet Balance:',
    balance: currency(walletData.value?.currentBalance),
    incomingBalance: isShowIncomingBalance.value ? walletData.value?.pendingIncomingBalanceFormatted : undefined,
    outcomingBalance: isShowOutgoingBalance.value ? walletData.value?.pendingOutcomingBalanceFormatted : undefined,
  },
]);

const tables = computed(() => [
  {
    title: 'Transactions:',
    header: undefined,
    data: getTransactionsState.value?.data || [],
    loading: isSkeleton.value && !props.isError,
    rowLength: 5,
    colspan: 5,
    tableRowComponent: VTableWalletTransactionsItem,
  },
]);

function onActionButtonClick(payload: { id: string | number }) {
  if (payload.id === 'add-funds') onAddFundsClick();
  if (payload.id === 'withdraw') onWithdrawClick();
}
</script>

<template>
  <div class="DashboardWalletTransactions dashboard-wallet-transactions">
    <VWalletTokensAndTransactions
      :balances="balances"
      :tables="tables"
      :action-buttons="actionButtons"
      @button-click="onActionButtonClick"
    />
    <VDialogWalletAddTransaction
      v-model="isDialogAddTransactionOpen"
      :transaction-type="addTransactiontTransactionType"
    />
  </div>
</template>

