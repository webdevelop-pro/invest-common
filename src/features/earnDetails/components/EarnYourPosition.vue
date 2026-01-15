<script setup lang="ts">
import VWalletTokensAndTransactions from 'InvestCommon/shared/components/VWalletTokensAndTransactions.vue';
import { useEarnYourPosition, type StatItem } from './composables/useEarnYourPosition';
import type { IEarnTransaction } from './composables/useEarnTransactionItem';

interface Props {
  stats?: StatItem[];
  transactions?: IEarnTransaction[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  stats: () => [],
  transactions: () => [],
  loading: false,
});

const { balances, tables } = useEarnYourPosition(props);
</script>

<template>
  <div class="EarnYourPosition earn-your-position">
    <VWalletTokensAndTransactions
      :balances="balances"
      :tables="tables"
      :balances-loading="loading"
      class="earn-your-position__wallet"
    />
  </div>
</template>

<style lang="scss">
.earn-your-position {
  &__wallet {
    max-width: 800px;
    margin: 0 auto;

    @media screen and (max-width: $tablet) {
      width: 100%;
      overflow: auto;
    }
  }

  .v-table-header {
    @media screen and (width < $tablet) {
      display: none;
    }
  }
}
</style>

