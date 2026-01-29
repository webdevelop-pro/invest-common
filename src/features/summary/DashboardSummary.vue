<script setup lang="ts">
import DashboardTabsTopInfo from 'InvestCommon/features/dashboard/components/DashboardTabsTopInfo.vue';
import CryptoPricesTicker from 'InvestCommon/features/summary/components/CryptoPricesTicker.vue';
import CardDonutUnified from 'InvestCommon/features/summary/components/CardDonutUnified.vue';
import { useSummaryData } from 'InvestCommon/features/summary/composables/useSummaryData';
import VCardOffer from 'UiKit/components/VCard/VCardOffer.vue';
import { urlOfferSingle, urlOffers } from 'InvestCommon/domain/config/links';
import VWalletTokensAndTransactions from 'InvestCommon/shared/components/VWalletTokensAndTransactions.vue';
import VCardGoal from 'InvestCommon/shared/components/VCardGoal.vue';
import VCardOfferFunded from 'InvestCommon/shared/components/VCardOfferFunded.vue';

const {
  cryptoItems,
  getPricesState,
  durationSec,
  isLoading,
  // categories
  categoryDonutData,
  categoryColors,
  categorySideItems,
  // assets
  offerDonutData,
  offerColors,
  offerSideItems,
  topFundedOffer,
  // portfolio
  topInvestedOffers,
  // wallet
  balances,
  tables,
} = useSummaryData();

</script>

<template>
  <div class="DashboardSummary dashboard-summary">
    <DashboardTabsTopInfo
      title="Overview"
      text="An overview of your account, portfolio and recent activity."
    />
    <div class="dashboard-summary__content">
      <CryptoPricesTicker
        :items="cryptoItems"
        :loading="getPricesState.loading"
        :error="getPricesState.error?.message"
        :duration-sec="durationSec"
      />
      <div class="dashboard-summary__grid">
        <CardDonutUnified
          class-name="investment-categories-card"
          aria-label="Investment Categories"
          title="Investment Categories"
          subtitle="Diversification by security types (%)"
          :loading="false"
          :data="categoryDonutData"
          :colors="categoryColors"
          :side-items="categorySideItems"
          :show-amount="true"
          :show-percent="true"
          :is-loading="isLoading"
        >
          <template #no-data>
            <div class="is--h6__title">
              Explore Active RWA Opportunities
            </div>
            <div class="is--subheading-2">
              Discover live asset-backed investments available today.
            </div>
            <a
              :href="urlOffers"
              class="is--link-1"
            >
              View Opportunities
            </a>
          </template>
        </CardDonutUnified> 

        <CardDonutUnified
          class-name="assets-diversification-card"
          aria-label="Assets Diversification"
          title="Assets Diversification"
          subtitle="Investment distribution by offers (%)"
          :loading="false"
          :data="offerDonutData"
          :colors="offerColors"
          :side-items="offerSideItems"
          :show-amount="false"
          :show-percent="true"
          :is-loading="isLoading"
        >
          <template #no-data>
            <div class="is--h6__title">
              Explore Active RWA Opportunities
            </div>
            <div class="is--subheading-2">
              Discover live asset-backed investments available today.
            </div>
            <a
              :href="urlOffers"
              class="is--link-1"
            >
              View Opportunities
            </a>
          </template>
        </CardDonutUnified>
      </div>

      <div
        v-if="topInvestedOffers.length > 0"
        class="dashboard-summary__grid"
      >
        <VCardGoal
          title="Bond term"
          subtitle="Months remaining until full payout"
          :months-remaining="22"
          :total-months="24"
        />

        <VCardOfferFunded
          v-for="offer in topInvestedOffers"
          :key="offer.id"
          :offer="offer"
        />
      </div>
      <div class="dashboard-summary__grid-offer">
        <VWalletTokensAndTransactions
          :balances="balances"
          :tables="tables"
          class="dashboard-summary__wallet"
        />
        <VCardOffer
          v-if="topFundedOffer"
          :offer="topFundedOffer"
          :href="urlOfferSingle(topFundedOffer.slug)"
        />
      </div>
    </div>
  </div>
</template>


<style lang="scss">
.dashboard-summary {
    &__content {
        display: flex;
        flex-direction: column;
    }

    &__grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 24px;
        margin-top: 40px;

      @media screen and (width < $tablet){
        grid-template-columns: 1fr;
        margin-top: 20px;
      }
    }

    &__grid-offer {
        display: grid;
        grid-template-columns:  2fr 0.8fr;
        gap: 24px;
        margin-top: 40px;

      @media screen and (width < $tablet){
        grid-template-columns: 1fr;
      }
    }

    &__wallet {
      @media screen and (width < $tablet){
        width: 100%;
        overflow: auto;
      }
    }
    
}
</style>