<script setup lang="ts">
import { toRefs } from 'vue';
import VWalletTokensAndTransactions from 'InvestCommon/shared/components/VWalletTokensAndTransactions.vue';
import { useEarnYourPosition, type StatItem } from '../composables/useEarnYourPosition';
import type { IEarnTransaction } from './VTableEarnTransactionItem.vue';

const props = defineProps<{
  stats: StatItem[];
  transactions: IEarnTransaction[];
  loading: boolean;
}>();

const { stats, transactions, loading } = toRefs(props);

const { balances, tables } = useEarnYourPosition(stats, transactions, loading);
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
  }
}
</style>

