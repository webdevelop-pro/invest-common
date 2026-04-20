<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import VTableDefault from 'InvestCommon/shared/components/VTableDefault.vue';
import VTableToolbar from 'InvestCommon/shared/components/VTableToolbar.vue';
import VTableYieldItem from './components/VTableYieldItem.vue';
import { useWallet } from 'InvestCommon/features/wallet/logic/useWallet';
import { useEarnTable } from './composables/useEarnTable';
import VTableResponsiveLoadingRow from 'InvestCommon/shared/components/VTableResponsiveLoadingRow.vue';

interface TableHeader {
  text: string;
  class?: string;
}

const globalLoader = useGlobalLoader();

const TABLE_HEADERS: TableHeader[] = [
  { text: 'Asset' },
  { text: 'TVL' },
  { text: 'APY' },
  { text: 'Base APY', class: 'is--gt-desktop-show' },
  { text: 'Reward APY', class: 'is--gt-desktop-show' },
  { text: '30d Avg APY', class: 'is--gt-desktop-show' },
  { text: 'Type', class: 'is--gt-desktop-show' },
  { text: 'Actions', class: 'is--gt-desktop-show' },
];

const {
  search,
  loading,
  visibleData,
  totalResults,
  filterResults,
  hasMore,
  onRowClick,
} = useEarnTable();

// Ensure wallet data is fetched when landing directly on Earn (no prior wallet view)
const {
  getWalletState,
  getEvmWalletState,
  updateData: updateWalletData,
} = useWallet();

const showEmptyMessage = computed(() => filterResults.value === 0 && search.value.trim().length > 0);

onMounted(() => {
  globalLoader.hide();

  // If neither fiat nor EVM wallet has data yet, trigger a wallet data fetch.
  if (!getWalletState.value.data && !getEvmWalletState.value.data) {
    void updateWalletData();
  }
});
</script>

<template>
  <div class="DashboardEarn dashboard-earn">
    <div
      class="dashboard-earn__tablet"
    >
      <h3 class="dashboard-earn__title is--h3__title">
        Available Assets to Supply
      </h3>

      <VTableToolbar
        v-model="search"
        :filter-results-length="filterResults"
        :total-results-length="totalResults"
      />
      <VTableDefault
        :loading-row-length="10"
        :header="TABLE_HEADERS"
        :loading="loading"
        :data="visibleData"
        :colspan="TABLE_HEADERS.length"
      >
        <template #loading>
          <VTableResponsiveLoadingRow
            :columns="TABLE_HEADERS.length"
            variant="yield"
          />
        </template>
        <VTableYieldItem
          v-for="pool in visibleData"
          :key="pool.pool"
          :data="pool"
          :search="search"
          @row-click="onRowClick"
        />
        <template #empty>
          <span v-if="showEmptyMessage">
            No pools found matching "{{ search }}"
          </span>
          <span v-else>
            No yield data available at this time.
          </span>
        </template>
      </VTableDefault>
      <div
        v-if="hasMore && !loading"
        ref="sentinel"
        class="dashboard-earn__sentinel"
        aria-hidden="true"
      />
    </div>
  </div>
</template>

<style lang="scss">
.dashboard-earn {
  $root: &;

  .v-table-toolbar__search {
    width: 50%;
  }

  &__tablet {
    @media screen and (max-width: $tablet) {
      width: 100%;
      overflow: auto;
    }
  }

  &__title {
    margin-bottom: 0;
  }

  &__alert {
    margin-bottom: 0 !important;
  }

  &__sentinel {
    height: 1px;
    width: 100%;
  }

  // Align first and last columns consistently with cell content
  .v-table-head:first-of-type {
    text-align: left;
  }

  .v-table-head:last-of-type {
    text-align: right;
  }
}
</style>
