<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { urlOffers } from 'InvestCommon/domain/config/links';
import VTableDefault from 'InvestCommon/shared/components/VTableDefault.vue';
import VTableToolbar from 'InvestCommon/shared/components/VTableToolbar.vue';
import { useDashboardPortfolioStore } from '../store/useDashboardPortfolio';
import VTablePortfolioItem from './VTablePortfolioItem.vue';

const portfolioTableHeader = [
  { text: 'ID' },
  { text: 'Offer' },
  { text: 'Date' },
  { text: 'Amount' },
  { text: 'Ownership' },
  { text: 'Funding Type' },
  { text: 'Status' },
  { text: '' },
];

const portfolioStore = useDashboardPortfolioStore();

const {
  search,
  filterPortfolio,
  totalResults,
  isFiltering,
  filteredData,
  filterResults,
  queryId,
  getInvestmentsState,
} = storeToRefs(portfolioStore);

const { onApplyFilter } = portfolioStore;
</script>

<template>
  <div class="PortfolioInvestmentsTable portfolio-investments-table">
    <VTableToolbar
      v-model="search"
      :filter-items="filterPortfolio"
      :filter-results-length="filterResults"
      :total-results-length="totalResults"
      @filter-items="onApplyFilter"
    />
    <VTableDefault
      :loading-row-length="10"
      :header="portfolioTableHeader"
      :loading="getInvestmentsState.loading && filteredData.length === 0"
      :data="filteredData"
      :colspan="9"
    >
      <VTablePortfolioItem
        v-for="item in filteredData"
        :key="item.id"
        :item="item"
        :search="search"
        :active-id="queryId"
        :colspan="portfolioTableHeader.length"
      />
      <template #empty>
        You have no investment
        <span v-if="filterResults === 0 && isFiltering">
          matching your criteria
        </span>
        <span v-else> yet. </span>
        Check out
        <a
          :href="urlOffers"
          class="is--link-1"
        >
          open offerings.
        </a>
      </template>
    </VTableDefault>
  </div>
</template>

