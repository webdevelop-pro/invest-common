<script setup lang="ts">
import { computed } from 'vue';
import {
  VTabs,
  VTabsList,
  VTabsTrigger,
  VTabsContent,
} from 'UiKit/components/Base/VTabs';
import VFilter from 'UiKit/components/VFilter/VFilter.vue';
import DashboardWalletTablePanel from 'InvestCommon/features/wallet/components/DashboardWalletTablePanel.vue';
import type { DashboardWalletTableConfig } from 'InvestCommon/features/wallet/logic/walletLogic.types';
import type { WalletFilterItem } from 'InvestCommon/features/wallet/logic/walletLogic.types';

const props = withDefaults(
  defineProps<{
    activeTab: string;
    holdingsTab: string;
    transactionsTab: string;
    holdingsTable: DashboardWalletTableConfig | null;
    transactionsTable: DashboardWalletTableConfig | null;
    filterItems: WalletFilterItem[];
    filterDisabled?: boolean;
  }>(),
  { filterDisabled: false },
);

const emit = defineEmits<{
  'update:activeTab': [value: string];
  filterApply: [items: { value: string; model: string[] }[]];
}>();

const activeTabModel = computed({
  get: () => props.activeTab,
  set: (value: string) => emit('update:activeTab', value),
});
</script>

<template>
  <VTabs
    v-model="activeTabModel"
    :default-value="holdingsTab"
    variant="secondary"
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
        :disabled="filterDisabled"
        class="dashboard-wallet__filters-button"
        @apply="emit('filterApply', $event)"
      />
    </div>

    <VTabsContent :value="holdingsTab">
      <DashboardWalletTablePanel :table="holdingsTable" />
    </VTabsContent>

    <VTabsContent :value="transactionsTab">
      <DashboardWalletTablePanel :table="transactionsTable" />
    </VTabsContent>
  </VTabs>
</template>
