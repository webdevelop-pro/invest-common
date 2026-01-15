<script setup lang="ts">
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import DashboardTabsTopInfo from 'InvestCommon/features/dashboard/components/DashboardTabsTopInfo.vue';
import VTableDefault from 'InvestCommon/shared/components/VTableDefault.vue';
import VTableToolbar from 'InvestCommon/shared/components/VTableToolbar.vue';
import VTableYieldItem from './components/VTableYieldItem.vue';
import { useEarnTable } from './composables/useEarnTable';

const globalLoader = useGlobalLoader();
globalLoader.hide();

const tableHeader = [
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
};

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
</script>

<template>
  <div class="DashboardEarn dashboard-earn">
    <DashboardTabsTopInfo
      :title="EARN_TAB_INFO.title"
      :sub-title="EARN_TAB_INFO.subTitle"
      :text="EARN_TAB_INFO.text"
    />
    <div class="dashboard-earn__tablet">
      <h3 class="is--h3__title">
        Aave Yield Opportunities
      </h3>

      <VTableToolbar
        v-model="search"
        :filter-results-length="filterResults"
        :total-results-length="totalResults"
      />
      <VTableDefault
        :loading-row-length="10"
        :header="tableHeader"
        :loading="loading && visibleData.length === 0"
        :data="visibleData"
        :colspan="tableHeader.length"
      >
        <VTableYieldItem
          v-for="(pool, index) in visibleData"
          :key="index"
          :data="pool"
          :search="search"
          size="small"
          @row-click="onRowClick"
        />
        <template #empty>
          <span v-if="filterResults === 0 && search">
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
      />
    </div>
  </div>
</template>

<style lang="scss">
.dashboard-earn {
  $root: &;

  &__tablet {
    margin-top: 40px;
  }

  &__sentinel {
    height: 1px;
    width: 100%;
  }
}
</style>

