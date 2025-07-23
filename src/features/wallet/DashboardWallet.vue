<script setup lang="ts">
import { defineAsyncComponent, onBeforeMount } from 'vue';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import DashboardTabsTopInfo from '@/views/Dashboard/components/DashboardTabsTopInfo.vue';
import { storeToRefs } from 'pinia';
import DashboardWalletBankAccounts from 'InvestCommon/features/wallet/DashboardWalletBankAccounts.vue';
import DashboardWalletTransactions from 'InvestCommon/features/wallet/DashboardWalletTransactions.vue';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useWalletMain } from './store/useWalletMain';

const VAlert = defineAsyncComponent({
  loader: () => import('UiKit/components/VAlert.vue'),
});

const userProfileStore = useProfilesStore();
const { selectedUserProfileData, selectedUserProfileId } = storeToRefs(userProfileStore);
const userSessionStore = useSessionStore();
const { userLoggedIn } = storeToRefs(userSessionStore);

const walletMainStore = useWalletMain();
const {
  isAlertShow,
  isAlertType,
  isAlertText,
  alertTitle,
  isWalletAlert,
  isTopTextShow,
  alertButtonText,
  FUNDING_TAB_INFO,
} = walletMainStore;

onBeforeMount(() => {
  walletMainStore.updateData();
});
</script>

<template>
  <div class="DashboardWallet dashboard-wallet">
    <DashboardTabsTopInfo
      :title="FUNDING_TAB_INFO.title"
      :text="isTopTextShow ? FUNDING_TAB_INFO.text : null"
    />
    <VAlert
      v-if="isAlertShow"
      :variant="isAlertType"
      data-testid="funding-alert"
      class="dashboard-wallet__alert"
      :button-text="alertButtonText"
      @click="walletMainStore.onAlertButtonClick"
    >
      <template #title>
        {{ alertTitle }}
      </template>
      <template #description>
        <span v-html="isAlertText" />
      </template>
    </VAlert>
    <div
      v-if="!isWalletAlert"
      class="dashboard-wallet__content"
    >
      <div class="dashboard-wallet__transactions">
        <DashboardWalletTransactions
          :profile-id="selectedUserProfileId"
          :logged-in="userLoggedIn"
          :is-error="isAlertShow"
        />
      </div>
      <div class="dashboard-wallet__bank-accounts">
        <DashboardWalletBankAccounts
          :logged-in="userLoggedIn"
          :profile-data="selectedUserProfileData"
          :is-error="isAlertShow"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.dashboard-wallet {
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
    gap: 80px;

    @media screen and (max-width: $tablet){
      gap: 40px;
      flex-direction: column-reverse;
    }
  }

  &__transactions {
    width: 50%;

    @media screen and (max-width: $tablet){
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
