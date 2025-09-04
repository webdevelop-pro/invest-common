<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import DashboardTabsTopInfo from 'InvestCommon/features/dashboard/components/DashboardTabsTopInfo.vue';
import DashboardEvmWalletTokens from './components/DashboardEvmWalletTokens.vue';
import { useDashboardEvm, EVM_WALLET_TAB_INFO } from './logic/useDashboardEvm';

const VDialogCryptoWallet = defineAsyncComponent({
  loader: () => import('./components/VDialogCryptoWallet.vue'),
});
const VAlert = defineAsyncComponent({
  loader: () => import('UiKit/components/VAlert.vue'),
});

// Keep VAlert as a static import to preserve slot typings
const {
  // state
  selectedUserProfileId,
  selectedUserProfileData,
  userLoggedIn,

  // repository state
  getEvmWalletState,

  // ui constants

  // computed
  isWalletError,
  isAlertShow,
  isTopTextShow,
  isAlertType,
  isAlertText,
  alertTitle,
  alertButtonText,

  // actions
  onAlertButtonClick,
  onTransactionClick,

  // dialog state
  isDialogTransactionOpen,
  transactiontType,
} = useDashboardEvm();
</script>

<template>
  <div class="DashboardEvmWallet dashboard-evm-wallet">
    <DashboardTabsTopInfo
      :title="EVM_WALLET_TAB_INFO.title"
      :text="isTopTextShow ? EVM_WALLET_TAB_INFO.text : null"
    />
    <VAlert
      v-if="isAlertShow"
      :variant="isAlertType"
      data-testid="funding-alert"
      class="dashboard-evm-wallet__alert"
      :button-text="alertButtonText"
      @click="onAlertButtonClick"
    >
      <template #title>
        {{ alertTitle }}
      </template>
      <template #description>
        <span v-html="isAlertText" />
      </template>
    </VAlert>
    <div
      v-if="!isWalletError"
      class="dashboard-evm-wallet__content"
    >
      <div class="dashboard-evm-wallet__transactions">
        <DashboardEvmWalletTokens
          :profile-id="selectedUserProfileId"
          :logged-in="userLoggedIn"
          :is-error="isAlertShow || selectedUserProfileData.isTypeSdira"
          @click="onTransactionClick"
        />
      </div>
    </div>

    <VDialogCryptoWallet
      v-model="isDialogTransactionOpen"
      :transaction-type="transactiontType"
      :data="getEvmWalletState.data"
    />
  </div>
</template>

<style lang="scss">
.dashboard-evm-wallet {
  &__table-title {
    margin-right: 20px;
  }

  &__tooltip-activator {
    text-transform: uppercase;
    border-bottom: 1px dotted $primary;
    color: $black;
    transition: all .3s ease;

    &:hover {
      color: $primary;
      border-color: transparent;
    }
  }

  &__top-info {
    margin-top: 40px;
    margin-bottom: 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__table-top {
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 20px;
  }

  &__funds-button-wrap {
    display: flex;
    justify-content: flex-end;
    margin: 30px 0;
  }

  &__funds-button {
    width: 100%;
    max-width: 200px;

    & + & {
      margin-left: 10px;
    }
  }

  &__table-numbers {
    display: flex;
    justify-content: space-between;
    margin-bottom: 40px;
  }

  &__content {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    gap: 80px;

    @media screen and (max-width: $tablet){
      gap: 40px;
      flex-direction: column-reverse;
    }
  }

  &__transactions {
    width: 70%;

    @media screen and (max-width: $desktop){
      width: 100%;
    }
  }

  &__bank-accounts {
    width: 50%;

    @media screen and (max-width: $tablet){
      width: 100%;
    }
  }

  &__alert {
    margin-bottom: 40px !important;
  }
}
</style>
