<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { urlOffers } from 'InvestCommon/domain/config/links';
import VTableDefault from 'InvestCommon/shared/components/VTableDefault.vue';
import VTableToolbar from 'InvestCommon/shared/components/VTableToolbar.vue';
import VTableResponsiveLoadingRow from 'InvestCommon/shared/components/VTableResponsiveLoadingRow.vue';
import { useDashboardPortfolioStore } from '../store/useDashboardPortfolio';
import VTablePortfolioItem from './VTablePortfolioItem.vue';
import VOfflineDataUnavailable from 'InvestCommon/shared/components/pwa/VOfflineDataUnavailable.vue';
import { isOfflineReadFailure } from 'InvestCommon/domain/pwa/offlineRead';

const portfolioTableHeader = [
  { text: 'ID', class: 'is--gt-tablet-show' },
  { text: 'Offer', class: 'is--gt-tablet-show' },
  { text: 'Date', class: 'is--gt-tablet-show' },
  { text: 'ID/Offer', class: 'is--lt-tablet-show' },
  { text: 'Amount' },
  { text: 'Ownership', class: 'is--gt-tablet-show' },
  { text: 'Funding Type', class: 'is--gt-tablet-show' },
  { text: 'Status', class: 'is--gt-tablet-show' },
  { text: '', class: 'is--gt-tablet-show' },
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
const shouldShowOfflineUnavailable = computed(() => (
  !getInvestmentsState.value.loading
  && filteredData.value.length === 0
  && isOfflineReadFailure(getInvestmentsState.value.error)
));
</script>

<template>
  <div class="PortfolioInvestmentsTable portfolio-investments-table">
    <VOfflineDataUnavailable
      v-if="shouldShowOfflineUnavailable"
      title="Portfolio unavailable offline"
      description="Your portfolio has not been cached on this device yet. Reconnect to load the latest investments, or explore pages you opened earlier. The app stays in read-only mode while you are offline."
      :primary-action="{ label: 'Explore Offers', href: urlOffers }"
    />
    <template v-else>
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
        <template #loading>
          <VTableResponsiveLoadingRow
            :columns="portfolioTableHeader.length - 1"
            variant="portfolio"
          />
        </template>
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
    </template>
  </div>
</template>
