<script setup lang="ts">
import {
  VTabs,
  VTabsList,
  VTabsTrigger,
  VTabsContent,
} from 'UiKit/components/Base/VTabs';
import VFilter from 'UiKit/components/VFilter/VFilter.vue';
import DashboardWalletTablePanel from 'InvestCommon/features/wallet/components/DashboardWalletTablePanel.vue';
import { useDashboardWalletTabs, type DashboardWalletTabsProps } from './logic/useDashboardWalletTabs';

const props = withDefaults(
  defineProps<DashboardWalletTabsProps>(),
  { filterDisabled: false },
);

const emit = defineEmits<{
  'update:activeTab': [value: string];
  filterApply: [items: { value: string; model: string[] }[]];
}>();

const { activeTabModel, filterDisabledComputed } = useDashboardWalletTabs(props, (event, value) => {
  if (event === 'update:activeTab') {
    emit('update:activeTab', value);
  }
});
</script>

<template>
  <VTabs
    v-model="activeTabModel"
    :default-value="holdingsTab"
    variant="secondary"
    query-key="wallet-tab"
    tabs-to-url
    class="dashboard-wallet__tabs"
  >
    <div class="dashboard-wallet__tabs-header">
      <VTabsList variant="secondary">
        <VTabsTrigger
          :value="holdingsTab"
          variant="secondary"
        >
          Holdings
        </VTabsTrigger>
        <VTabsTrigger
          :value="transactionsTab"
          variant="secondary"
        >
          Transactions
        </VTabsTrigger>
      </VTabsList>

      <VFilter
        :items="filterItems"
        :disabled="filterDisabledComputed"
        class="dashboard-wallet__filters-button"
        @apply="emit('filterApply', $event)"
      />
    </div>

    <VTabsContent :value="holdingsTab">
      <DashboardWalletTablePanel
        :table="holdingsTable"
        :loading="loading"
      />
    </VTabsContent>

    <VTabsContent :value="transactionsTab">
      <DashboardWalletTablePanel
        :table="transactionsTable"
        :loading="loading"
      />
    </VTabsContent>
  </VTabs>
</template>
