<script setup lang="ts">
import {
  useDashboardWallet,
  HOLDINGS_TAB,
  TRANSACTIONS_TAB,
} from 'InvestCommon/features/wallet/logic/useDashboardWallet';
import DashboardWalletAlert from 'InvestCommon/features/wallet/components/DashboardWalletAlert.vue';
import DashboardWalletHeader from 'InvestCommon/features/wallet/components/DashboardWalletHeader.vue';
import DashboardWalletBalanceCards from 'InvestCommon/features/wallet/components/DashboardWalletBalanceCards.vue';
import DashboardWalletTabs from 'InvestCommon/features/wallet/components/DashboardWalletTabs.vue';
import VDialogWallet from 'InvestCommon/features/wallet/components/VDialogWallet.vue';

const {
  activeTab,
  summaryEvmWalletState,
  isAlertShow,
  isAlertType,
  isAlertText,
  alertTitle,
  alertButtonText,
  onAlertButtonClick,
  handleContactUsClick,
  showTable,
  totalBalanceMainFormatted,
  totalBalanceCoins,
  primaryButtons,
  moreButtons,
  handlePrimaryActionClick,
  balanceCards,
  holdingsTable,
  transactionsTable,
  walletFilterItemsComputed,
  filterDisabled,
  handleWalletFilterApply,
  isDialogTransactionOpen,
  transactionType,
} = useDashboardWallet();
</script>

<template>
  <div class="DashboardWallet dashboard-wallet">
    <DashboardWalletAlert
      :show="isAlertShow"
      :variant="isAlertType"
      :alert-text="isAlertText"
      :alert-title="alertTitle"
      :button-text="alertButtonText"
      @click="onAlertButtonClick"
      @contact-us-click="handleContactUsClick"
    />

    <DashboardWalletHeader
      :amount="totalBalanceMainFormatted"
      :coin="totalBalanceCoins"
      :buttons="primaryButtons"
      :more-buttons="moreButtons"
      @click="handlePrimaryActionClick"
    />

    <div
      v-if="showTable"
      class="dashboard-wallet__wrap"
    >
      <DashboardWalletBalanceCards :cards="balanceCards" />

      <section class="dashboard-wallet__main-card">
        <DashboardWalletTabs
          v-model:active-tab="activeTab"
          :holdings-tab="HOLDINGS_TAB"
          :transactions-tab="TRANSACTIONS_TAB"
          :holdings-table="holdingsTable"
          :transactions-table="transactionsTable"
          :filter-items="walletFilterItemsComputed"
          :filter-disabled="filterDisabled"
          @filter-apply="handleWalletFilterApply"
        />
      </section>
    </div>

    <VDialogWallet
      v-model="isDialogTransactionOpen"
      :transaction-type="transactionType"
      :data="summaryEvmWalletState.data"
    />
  </div>
</template>

<style lang="scss">
.dashboard-wallet {
  display: flex;
  flex-direction: column;
  gap: 40px;

  &__alert {
    margin-bottom: 0 !important;
  }

  &__wrap {
    background: $white;
    box-shadow: $box-shadow-medium;
  }

  &__main-card {
    padding: 20px;
  }

  &__tabs-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__filters-button {
    font-size: 14px;
  }

  &__table {
    width: 100%;
  }

  &--icon-external-link {
    width: 14px;
  }

  .v-tabs-list-wrapper {
    width: fit-content;
  }

  .v-tabs-content {
    padding-top: 20px;
  }

  .v-table-head {
    &:last-of-type {
      text-align: end;
    }
  }
}
</style>
