<script setup lang="ts">
import { urlOffers } from 'InvestCommon/domain/config/links';
import DashboardTabsTopInfo from 'InvestCommon/features/dashboard/components/DashboardTabsTopInfo.vue';;
import { storeToRefs } from 'pinia';
import VTableDefault from 'InvestCommon/shared/components/VTableDefault.vue';
import VTablePortfolioItem from './components/VTablePortfolioItem.vue';
import VTableToolbar from 'InvestCommon/shared/components/VTableToolbar.vue';
import { useDashboardPortfolioStore } from './store/useDashboardPortfolio';

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
const PORTFOLIO_TAB_INFO = {
  title: 'Portfolio',
  subTitle: 'Your holdings and belongings',
  text: `
    One of the most important things to consider when creating a portfolio is your personal risk tolerance.
    Your risk tolerance is your ability to accept investment losses in exchange for the possibility of
    earning higher investment returns. Learn more about 
    <a href="/resource-center/investors-due-diligence"  class="is--link-2">due diligence</a> 
    process in our blog post.
  `,
};

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
  <div class="DashboardPortfolio dashboard-portfolio">
    <DashboardTabsTopInfo
      :title="PORTFOLIO_TAB_INFO.title"
      :sub-title="PORTFOLIO_TAB_INFO.subTitle"
      :text="PORTFOLIO_TAB_INFO.text"
    />
    <div class="dashboard-portfolio__tablet">
      <h3 class="is--h3__title">
        Your Investments
      </h3>
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
  </div>
</template>

<style lang="scss">
.dashboard-portfolio {
  $root: &;

  &__table-item-header {
    display: flex;
    align-items: center;
    align-self: stretch;
    width: 100%;
    margin: -12px -16px;
  }

  &__expand {
    width: 52px;
  }

  &__table-id {
    min-width: 90px;
    width: 5%;
    #{$root}__accordion-item & {
      color: $gray-80;
    }
  }

  &__table-offer {
    width: 23%;
    #{$root}__accordion-item & {
      color: $gray-80;
    }
  }

  &__table-offer-wrap {
    display: flex;
    align-items: center;
  }

  &__table-date {
    width: 130px;
    #{$root}__accordion-item & {
      color: $gray-80;
    }
  }

  &__table-amount {
    width: 12%;
    #{$root}__accordion-item & {
      color: $gray-80;
    }
  }

  &__table-ownership {
    width: 13%;
    text-transform: capitalize;
    #{$root}__accordion-item & {
      color: $gray-80;
    }
  }

  &__table-funding {
    width: 13.5%;
    text-transform: capitalize;
  }

  &__table-status {
    width: 15.5%;
    #{$root}__table-tag {
      color: $gray-70 !important;
    }
  }

  &__table-image {
    width: 55px;
    height: 55px;
    object-fit: cover;
  }
}
</style>

<style lang="scss">
.dashboard-portfolio {
  $root: &;

  &__table {
    margin-top: 40px;
  }

  &__tablet-link {
    text-transform: uppercase;
    border-bottom: 1px dotted $primary;
    color: $black;
    transition: all .3s ease;

    &:hover {
      color: $primary;
      border-color: transparent;
    }
  }

  &__toolbar {
    display: flex;
    padding-top: 16px;
    padding-bottom: 12px;
    align-items: center;
    gap: 8px;
    align-self: stretch;
    justify-content: space-between;
  }

  &__table-header {
    display: flex;
    align-items: flex-start;
    align-self: stretch;
    width: 100%;
    color: $gray-60;
    font-size: 14px;
    font-style: normal;
    font-weight: 800;
    line-height: 21px;
    padding-right: 80px;
  }

  &__toolbar-left {
    display: flex;
    gap: 8px;
    align-items: center;
    width: 100%;
  }

  &__filter {
    --v-filter-dropdown-min-width: 250px
  }

  &__export-icon {
    width: 16px;
  }

  &__search {
    width: 34.5%;
  }
}
</style>
