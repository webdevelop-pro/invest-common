<script setup lang="ts">
import { currency } from 'InvestCommon/helpers/currency';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VTooltip from 'UiKit/components/VTooltip.vue';
import plus from 'UiKit/assets/images/plus.svg';
import VTableDefault from 'InvestCommon/shared/components/VTableDefault.vue';
import VTableWalletTokensItem from './VTableWalletTokensItem.vue';
import env from 'InvestCommon/domain/config/env';
import { EvmTransactionTypes } from 'InvestCommon/data/evm/evm.types';
import { useDashboardEvmWalletTokens } from './logic/useDashboardEvmWalletTokens';

defineProps({
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

const {
  getEvmWalletState,
  tableOptions,
  isShowIncomingBalance,
  isShowOutgoingBalance,
  canWithdraw,
  canExchange,
  isSkeleton,
} = useDashboardEvmWalletTokens();
</script>

<template>
  <div class="DashboardEvmWalletTokens dashboard-evm-wallet-tokens">
    <div class="dashboard-evm-wallet-tokens__top">
      <div class="dashboard-evm-wallet-tokens__balance">
        <div class="dashboard-evm-wallet-tokens__top-title is--h6__title">
          Wallet Balance:
        </div>
        <div class="dashboard-evm-wallet-tokens__balance-numbers">
          <a
            :href="`${env.CRYPTO_WALLET_SCAN_URL}/address/${getEvmWalletState.data?.address}`"
            class="dashboard-evm-wallet-tokens__balance-current is--subheading-1"
          >
            {{ currency(getEvmWalletState.data?.currentBalance) }}
          </a>
          <span
            v-if="isShowIncomingBalance"
            class="dashboard-evm-wallet-tokens__balance-incoming is--small"
          >
            + {{ currency(getEvmWalletState.data?.pending_incoming_balance) }}
          </span>
          <span v-if="isShowOutgoingBalance">|</span>
          <VTooltip
            class="dashboard-evm-wallet-tokens__tooltip"
          >
            <span
              v-if="isShowOutgoingBalance"
              class="dashboard-evm-wallet-tokens__balance-outcoming is--small"
            >
              - {{ currency(getEvmWalletState.data?.pending_outcoming_balance) }}
            </span>
            <template #content>
              Pending investment
            </template>
          </VTooltip>
        </div>
      </div>
      <div class="dashboard-evm-wallet-tokens__buttons">
        <VButton
          icon-placement="left"
          size="small"
          data-testid="funding-add-funds-btn"
          class="dashboard-evm-wallet-tokens__funds-button"
          @click="emit('click', EvmTransactionTypes.deposit)"
        >
          <plus
            alt="plus icon"
            class="dashboard-evm-wallet-tokens__button-icon"
          />
          Add Funds
        </VButton>
        <VButton
          size="small"
          variant="outlined"
          :disabled="!canWithdraw"
          class="dashboard-evm-wallet-tokens__funds-button"
          @click="emit('click', EvmTransactionTypes.withdrawal)"
        >
          Withdraw
        </VButton>
        <VButton
          size="small"
          variant="outlined"
          :disabled="!canExchange"
          class="dashboard-evm-wallet-tokens__funds-button"
          @click="emit('click', EvmTransactionTypes.exchange)"
        >
          Exchange
        </VButton>
      </div>
    </div>
    <div class="dashboard-evm-wallet-tokens__content">
      <div class="dashboard-evm-wallet-tokens__content-top is--h6__title">
        Tokens:
      </div>
      <VTableDefault
        class="investment-documents__table"
        size="small"
        :data="tableOptions || []"
        :loading="isSkeleton && !isError"
        :loading-row-length="5"
        :colspan="5"
      >
        <VTableWalletTokensItem
          v-for="(item, index) in tableOptions"
          :key="index"
          :data="item"
          size="small"
        />
        <template #empty>
          You have no tokens yet
        </template>
      </VTableDefault>
    </div>
    <!-- <VDialogWalletAddTransaction
      v-model="isDialogAddTransactionOpen"
      :transaction-type="addTransactiontTransactionType"
    /> -->
  </div>
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
