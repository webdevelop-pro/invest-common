<script setup lang="ts">
import { EvmTransactionTypes } from 'InvestCommon/data/evm/evm.types';
import VWalletTokensAndTransactions from 'InvestCommon/shared/components/VWalletTokensAndTransactions.vue';
import { useWalletTokens } from './logic/useWalletTokens';
import { useWalletActions } from 'InvestCommon/features/wallet/logic/useWalletActions';

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

const { tables } = useWalletTokens();
const {
  balances,
  buttonConfigs,
  handleButtonClick,
} = useWalletActions(props, emit);
</script>

<template>
  <VWalletTokensAndTransactions
    :balances="balances"
    :tables="tables"
    :action-buttons="buttonConfigs"
    class="DashboardEvmWalletTokens dashboard-evm-wallet-tokens"
    @button-click="handleButtonClick"
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
