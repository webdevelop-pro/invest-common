<script setup lang="ts">
import { computed } from 'vue';
import DashboardTabsTopInfo from 'InvestCommon/features/dashboard/components/DashboardTabsTopInfo.vue';
import CryptoPricesTicker from 'InvestCommon/features/summary/components/CryptoPricesTicker.vue';
import CardDonutUnified from 'InvestCommon/features/summary/components/CardDonutUnified.vue';
import { useSummaryData } from 'InvestCommon/features/summary/composables/useSummaryData';
import VCardOffer from 'UiKit/components/VCard/VCardOffer.vue';
import { urlOfferSingle, urlOffers } from 'InvestCommon/domain/config/links';
import VCardGoal from 'InvestCommon/shared/components/VCardGoal.vue';
import VCardOfferFunded from 'InvestCommon/shared/components/VCardOfferFunded.vue';
import VSliderCards from 'UiKit/components/VSlider/VSliderCards.vue';
import { VCardInfo } from 'UiKit/components/Base/VCard';
import { useDashboardTopInfoRight } from 'InvestCommon/features/dashboard/composables/useDashboardTopInfoRight';
import { useBreakpoints } from 'UiKit/composables/useBreakpoints';
import { useDashboardWallet } from 'InvestCommon/features/wallet/logic/useDashboardWallet';
import DashboardWalletBalanceCards from 'InvestCommon/features/wallet/components/DashboardWalletBalanceCards.vue';
import DashboardWalletTablePanel from 'InvestCommon/features/wallet/components/DashboardWalletTablePanel.vue';

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
} = useSummaryData();

const {
  balanceCards,
  holdingsTable,
  isWalletDataLoading,
} = useDashboardWallet();

const summaryHoldingsTable = computed(() => {
  const table = holdingsTable?.value;

  if (!table) return null;

  return {
    ...table,
    data: (table.data ?? []).slice(0, 4),
    infiniteScroll: false,
    infiniteScrollDisabled: true,
    onLoadMore: undefined,
  };
});

const { isTablet } = useBreakpoints();
const { sliderData: dashboardTopInfoData, isLoading: isDashboardTopInfoLoading } = useDashboardTopInfoRight();

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
      <div
        v-if="isTablet && !isDashboardTopInfoLoading"
        class="dashboard-summary__mobile-slider is--margin-top-20"
      >
        <VSliderCards :data="dashboardTopInfoData">
          <template #default="{ slide }">
            <VCardInfo
              class="dashboard-summary__top-info-card"
              min-width="172px"
              :amount="slide?.currency"
              :unit="slide?.coin"
              :title="slide?.title"
              :secondary-text="slide?.secondaryText"
              :secondary-value="slide?.secondaryValue"
              :value-props="{ amountClass: 'is--h2__title' }"
            />
          </template>
        </VSliderCards>
      </div>
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
        <div class="dashboard-summary__wallet">
          <DashboardWalletBalanceCards
            :cards="balanceCards"
            :loading="isWalletDataLoading"
          />
          <section
            class="dashboard-summary__wallet-tabs"
          >
            <DashboardWalletTablePanel :table="summaryHoldingsTable" />
          </section>
        </div>
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

    &__top-info-card {
      flex: 1 0 0;
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
      display: flex;
      flex-direction: column;
      gap: 0;
      background: $white;
      box-shadow: $box-shadow-medium;

      @media screen and (width < $tablet) {
        width: 100%;
        overflow: auto;
      }
    }

    &__wallet-tabs {
      padding: 20px;
    }
    
}
</style>