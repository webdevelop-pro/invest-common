<script setup lang="ts">
import VTextCurrencyWithUnit from 'UiKit/components/VText/VTextCurrencyWithUnit.vue';

defineProps<{
  amount: string | number;
  coin?: string;
  loading?: boolean;
}>();
</script>

<template>
  <div class="dashboard-wallet-header-total">
    <div class="dashboard-wallet-header-total__label is--h6__title">
      Total Balance:
    </div>
    <VTextCurrencyWithUnit
      class="dashboard-wallet-header-total__value"
      :amount="amount"
      :unit="coin"
      :loading="loading"
      amount-class="is--h1__title"
    />
    <div class="dashboard-wallet-header-total__subtitle is--small">
      Fiat, Crypto, and RWA holdings in one wallet.
    </div>
  </div>
</template>

<style lang="scss">
.dashboard-wallet-header-total {
  &__label {
    color: $gray-70;
  }

  &__value {
    color: $black;
  }

  &__subtitle {
    color: $gray-80;
  }
}
</style>
