<script setup lang="ts">
import { ref, computed } from 'vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VWalletTokensAndTransactions from 'InvestCommon/shared/components/VWalletTokensAndTransactions.vue';
import { useEarnYourPosition, type StatItem } from './composables/useEarnYourPosition';
import type { IEarnTransaction } from './composables/useEarnTransactionItem';
import VEarnWithdrawDialog from './VEarnWithdrawDialog.vue';

interface Props {
  stats?: StatItem[];
  transactions?: IEarnTransaction[];
  loading?: boolean;
  poolId?: string;
  profileId?: string | number;
  symbol?: string;
}

const props = withDefaults(defineProps<Props>(), {
  stats: () => [],
  transactions: () => [],
  loading: false,
});

const { balances, tables } = useEarnYourPosition(props);

const isWithdrawOpen = ref(false);

const canWithdraw = computed(() => {
  const stakedStat = props.stats?.[0];
  return !!stakedStat && stakedStat.amount > 0;
});
</script>

<template>
  <div
    id="earn-your-position-table"
    class="EarnYourPosition earn-your-position"
  >
    <div class="earn-your-position__header">
      <VButton
        variant="link"
        size="small"
        class="earn-your-position__withdraw-button"
        :disabled="!canWithdraw"
        @click="isWithdrawOpen = true"
      >
        Withdraw
      </VButton>
    </div>

    <VWalletTokensAndTransactions
      :balances="balances"
      :tables="tables"
      :balances-loading="loading"
      class="earn-your-position__wallet"
    />

    <VEarnWithdrawDialog
      v-model:open="isWithdrawOpen"
      :pool-id="poolId"
      :profile-id="profileId"
      :symbol="symbol"
    />
  </div>
</template>

<style lang="scss">
.earn-your-position {
  &__header {
    display: flex;
    justify-content: flex-end;
    max-width: 800px;
    margin: 0 auto 8px;
  }

  &__wallet {
    max-width: 800px;
    margin: 0 auto;

    @media screen and (width < $desktop) {
      width: 100%;
      overflow: auto;
    }
  }

  .v-table-header {
    @media screen and (width < $desktop) {
      display: none;
    }
  }
}
</style>

