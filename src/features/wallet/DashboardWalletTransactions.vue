<script setup lang="ts">
import { defineAsyncComponent, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { currency } from 'InvestCommon/helpers/currency';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VTooltip from 'UiKit/components/VTooltip.vue';
import plus from 'UiKit/assets/images/plus.svg';
import VTableDefault from 'InvestCommon/core/components/VTableDefault.vue';
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

const walletTransactionsStore = useWalletTransactions();
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
} = storeToRefs(walletTransactionsStore);

watch(() => [props.profileId, props.loggedIn], ([newProfileId, newLoggedIn]) => {
  walletTransactionsStore.setProfileContext(Number(newProfileId), Boolean(newLoggedIn));
}, { immediate: true });

const VDialogWalletAddTransaction = defineAsyncComponent({
  loader: () => import('./components/VDialogWalletAddTransaction.vue'),
});
</script>

<template>
  <div class="DashboardWalletTransactions dashboard-wallet-transactions">
    <div class="dashboard-wallet-transactions__top">
      <div class="dashboard-wallet-transactions__balance">
        <div class="dashboard-wallet-transactions__top-title is--h6__title">
          Wallet Balance:
        </div>
        <div class="dashboard-wallet-transactions__balance-numbers">
          <span class="dashboard-wallet-transactions__balance-current is--subheading-1">
            {{ currency(walletData?.currentBalance) }}
          </span>
          <span
            v-if="isShowIncomingBalance"
            class="dashboard-wallet-transactions__balance-incoming is--small"
          >
            + {{ currency(walletData?.pendingIncomingBalance) }}
          </span>
          <span v-if="isShowOutgoingBalance">|</span>
          <VTooltip
            class="dashboard-wallet-transactions__tooltip"
          >
            <span
              v-if="isShowOutgoingBalance"
              class="dashboard-wallet-transactions__balance-outcoming is--small"
            >
              - {{ currency(walletData?.pendingOutcomingBalance) }}
            </span>
            <template #content>
              Pending investment
            </template>
          </VTooltip>
        </div>
      </div>
      <div class="dashboard-wallet-transactions__buttons">
        <VButton
          icon-placement="left"
          size="small"
          :disabled="!isCanLoadFunds"
          data-testid="funding-add-funds-btn"
          class="dashboard-wallet-transactions__funds-button"
          @click="walletTransactionsStore.onAddFundsClick"
        >
          <plus
            alt="plus icon"
            class="dashboard-wallet-transactions__button-icon"
          />
          Add Funds
        </VButton>
        <VButton
          :disabled="!isCanWithdraw"
          size="small"
          variant="outlined"
          data-testid="funding-withdraw-btn"
          class="dashboard-wallet-transactions__funds-button"
          @click="walletTransactionsStore.onWithdrawClick"
        >
          Withdraw
        </VButton>
      </div>
    </div>
    <div class="dashboard-wallet-transactions__content">
      <div class="dashboard-wallet-transactions__content-top is--h6__title">
        Transactions:
      </div>
      <VTableDefault
        class="investment-documents__table"
        size="small"
        :data="getTransactionsState?.data || []"
        :loading="isSkeleton && !isError"
        :loading-row-length="5"
        :colspan="5"
      >
        <VTableWalletTransactionsItem
          v-for="item in getTransactionsState?.data"
          :key="item.id"
          :data="item"
          size="small"
        />
        <template #empty>
          You have no transactions yet
        </template>
      </VTableDefault>
    </div>
    <VDialogWalletAddTransaction
      v-model="isDialogAddTransactionOpen"
      :transaction-type="addTransactiontTransactionType"
    />
  </div>
</template>

<style lang="scss">
.dashboard-wallet-transactions {
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
  }

  &__top-title {
    color: $gray-70;
  }

  &__balance-numbers {
    color: $gray-40;
  }

  &__balance-current {
    color: $black;
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
    align-items: flex-start;
    gap: 10px;
    align-self: stretch;
    color: $gray-70;
  }

  &__button-icon {
    width: 16px;
  }
}
</style>
