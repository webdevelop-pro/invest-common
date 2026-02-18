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
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';

const {
  activeTab,
  summaryEvmWalletState,
  isWalletDataLoading,
  isAlertDataLoading,
  isAlertShow,
  isAlertType,
  isAlertText,
  alertTitle,
  isWalletBlocked,
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
    <div
      v-if="isAlertDataLoading"
      class="dashboard-wallet__alert dashboard-wallet__alert-skeleton"
      data-testid="funding-alert-skeleton"
    >
      <VSkeleton
        height="50px"
        width="100%"
        class="dashboard-wallet__alert-skeleton-line"
      />
    </div>
    <DashboardWalletAlert
      v-else-if="isAlertShow"
      :show="true"
      :variant="isAlertType"
      :alert-text="isAlertText"
      :alert-title="alertTitle"
      :button-text="alertButtonText"
      @click="onAlertButtonClick"
      @contact-us-click="handleContactUsClick"
    />

    <DashboardWalletHeader
      v-if="showTable"
      :amount="totalBalanceMainFormatted"
      :coin="totalBalanceCoins"
      :loading="isWalletDataLoading"
      :buttons="primaryButtons"
      :more-buttons="moreButtons"
      :class="[
        'dashboard-wallet__content',
        { 'dashboard-wallet__content--blocked': isWalletBlocked },
      ]"
      @click="handlePrimaryActionClick"
    />

    <div
      v-if="showTable"
      class="dashboard-wallet__wrap"
      :class="[
        'dashboard-wallet__content',
        { 'dashboard-wallet__content--blocked': isWalletBlocked },
      ]"
    >
      <DashboardWalletBalanceCards
        :cards="balanceCards"
        :loading="isWalletDataLoading"
      />

      <section class="dashboard-wallet__main-card">
        <DashboardWalletTabs
          v-model:active-tab="activeTab"
          :holdings-tab="HOLDINGS_TAB"
          :loading="isWalletDataLoading"
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

  &__alert-wrapper {
    position: relative;
  }

  &__content {
    transition: opacity 0.2s ease-in-out;
  }

  &__content--blocked {
    opacity: 0.4;
    pointer-events: none;
  }

  &__wrap {
    background: $white;
    box-shadow: $box-shadow-medium;

    @media screen and (width < $tablet){
        margin: 0 -15px;
    }
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
