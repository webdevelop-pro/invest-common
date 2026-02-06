<script setup lang="ts">
import VTableDefault from 'InvestCommon/shared/components/VTableDefault.vue';
import type { DashboardWalletTableConfig } from 'InvestCommon/features/wallet/logic/walletLogic.types';

defineProps<{
  table: DashboardWalletTableConfig | null;
}>();
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
    <component
      :is="table.tableRowComponent"
      v-for="(row, index) in table.data"
      :key="index"
      :data="row"
      size="small"
    />
  </VTableDefault>
</template>
