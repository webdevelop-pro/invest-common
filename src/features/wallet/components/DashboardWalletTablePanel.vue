<script setup lang="ts">
import { computed } from 'vue';
import VTableDefault from 'InvestCommon/shared/components/VTableDefault.vue';
import type { DashboardWalletTableConfig } from 'InvestCommon/features/wallet/logic/walletLogic.types';

const props = defineProps<{
  table: DashboardWalletTableConfig | null;
}>();

const isHoldingsTable = computed(
  () => !!props.table && props.table.header?.[0]?.text === 'Token',
);

const isTransactionsTable = computed(
  () => !!props.table && props.table.header?.[0]?.text === 'Date',
);
</script>

<template>
  <VTableDefault
    v-if="table"
    class="dashboard-wallet__table"
    size="small"
    :header="table.header"
    :data="table.data || []"
    :loading="!!table.loading"
    :loading-row-length="table.rowLength ?? 5"
    :colspan="table.colspan ?? table.header.length"
    :infinite-scroll="table.infiniteScroll"
    :infinite-scroll-disabled="table.infiniteScrollDisabled"
    @load-more="table.onLoadMore?.()"
  >
    <template #empty>
      <p v-if="isHoldingsTable">
        You don’t have any tokens yet.
      </p>
      <p v-else-if="isTransactionsTable">
        You don’t have any transactions yet.
      </p>
      <p v-else>
        No data available.
      </p>
    </template>

    <component
      :is="table.tableRowComponent"
      v-for="(row, index) in table.data"
      :key="index"
      :data="row"
      size="small"
    />
  </VTableDefault>
</template>
