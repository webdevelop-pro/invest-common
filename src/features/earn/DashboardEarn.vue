<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import DashboardTabsTopInfo from 'InvestCommon/features/dashboard/components/DashboardTabsTopInfo.vue';
import VTableDefault from 'InvestCommon/shared/components/VTableDefault.vue';
import VTableToolbar from 'InvestCommon/shared/components/VTableToolbar.vue';
import VTableYieldItem from './components/VTableYieldItem.vue';
import { useEarnTable } from './composables/useEarnTable';

interface TableHeader {
  text: string;
  class?: string;
}

const globalLoader = useGlobalLoader();

const TABLE_HEADERS: TableHeader[] = [
  { text: 'Symbol' },
  { text: 'TVL' },
  { text: 'APY' },
  { text: 'Base APY' },
  { text: 'Reward APY' },
  { text: '30d Avg APY' },
  { text: 'Type' },
  { text: 'Actions' },
];

const EARN_TAB_INFO = {
  title: 'Earn',
  subTitle: 'Yield opportunities',
  text: 'Discover earning opportunities and explore ways to grow your wealth and maximize returns. Explore Aave lending pools with the highest yields. Data provided by DefiLlama.',
} as const;

const {
  search,
  loading,
  visibleData,
  totalResults,
  filterResults,
  hasMore,
  sentinel,
  onRowClick,
} = useEarnTable();

const isLoading = computed(() => loading.value && visibleData.value.length === 0);
const showEmptyMessage = computed(() => filterResults.value === 0 && search.value.trim().length > 0);

onMounted(() => {
  globalLoader.hide();
});
</script>

<template>
  <div class="DashboardEarn dashboard-earn">
    <DashboardTabsTopInfo
      :title="EARN_TAB_INFO.title"
      :sub-title="EARN_TAB_INFO.subTitle"
      :text="EARN_TAB_INFO.text"
    />
    <div class="dashboard-earn__tablet">
      <h3 class="dashboard-earn__title is--h3__title">
        Aave Yield Opportunities
      </h3>

      <VTableToolbar
        v-model="search"
        :filter-results-length="filterResults"
        :total-results-length="totalResults"
      />
      <VTableDefault
        :loading-row-length="10"
        :header="TABLE_HEADERS"
        :loading="isLoading"
        :data="visibleData"
        :colspan="TABLE_HEADERS.length"
      >
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

  &__tablet {
    margin-top: 40px;

    @media screen and (max-width: $tablet) {
      width: 100%;
      overflow: auto;
    }
  }

  &__title {
    margin-bottom: 0;
  }

  &__sentinel {
    height: 1px;
    width: 100%;
  }

  .v-table-header {
    @media screen and (width < $desktop) {
      display: none;
    }
  }
}
</style>

