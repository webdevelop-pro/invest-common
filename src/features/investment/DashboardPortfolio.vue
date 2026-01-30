<script setup lang="ts">
import { ref } from 'vue';
import { urlBlogSingle } from 'InvestCommon/domain/config/links';
import DashboardTabsTopInfo from 'InvestCommon/features/dashboard/components/DashboardTabsTopInfo.vue';;
import { PostLinkTypes } from 'InvestCommon/types/api/blog';
import { VTabs, VTabsList, VTabsTrigger, VTabsContent } from 'UiKit/components/Base/VTabs';
import DashboardDistributions from 'InvestCommon/features/distributions/DashboardDistributions.vue';
import PortfolioInvestmentsTable from './components/PortfolioInvestmentsTable.vue';

const PORTFOLIO_TAB_INFO = {
  title: 'Portfolio',
  subTitle: 'Your holdings and belongings',
  text: `
    One of the most important things to consider when creating a portfolio is your personal risk tolerance.
    Your risk tolerance is your ability to accept investment losses in exchange for the possibility of
    earning higher investment returns. Learn more about 
    <a href="${urlBlogSingle(PostLinkTypes.investorsDueDiligence)}"  class="is--link-2">due diligence</a> 
    process in our blog post.
  `,
};

const activeTab = ref('investments');
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
      <VTabs
        v-model="activeTab"
        variant="secondary"
        query-key="portfolio-tab"
        default-value="investments"
        tabs-to-url
        class="dashboard-portfolio__mobile-tabs"
      >
        <VTabsList variant="secondary">
          <VTabsTrigger
            value="investments"
            variant="secondary"
          >
            Investments
          </VTabsTrigger>
          <VTabsTrigger
            value="distributions"
            variant="secondary"
          >
            Distributions
          </VTabsTrigger>
        </VTabsList>
        <VTabsContent value="investments">
          <PortfolioInvestmentsTable />
        </VTabsContent>
        <VTabsContent value="distributions">
          <DashboardDistributions />
        </VTabsContent>
      </VTabs>
      <div class="dashboard-portfolio__desktop-content">
        <PortfolioInvestmentsTable />
      </div>
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

  .v-tabs-list {
    width: fit-content;
    max-width: 100%;  
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

  &__mobile-tabs {
    display: none;

    @media screen and (max-width: $tablet) {
      display: block;
      margin-top: 16px;

      .v-tabs-content {
        padding-top: 24px;
      }
    }
  }

  &__desktop-content {
    @media screen and (max-width: $tablet) {
      display: none;
    }
  }
}
</style>
