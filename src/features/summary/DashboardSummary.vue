<script setup lang="ts">
import DashboardTabsTopInfo from 'InvestCommon/features/dashboard/components/DashboardTabsTopInfo.vue';
import CryptoPricesTicker from 'InvestCommon/features/summary/components/CryptoPricesTicker.vue';
import CardDonutUnified from 'InvestCommon/features/summary/components/CardDonutUnified.vue';
import { useSummaryData } from 'InvestCommon/features/summary/composables/useSummaryData';
import VCardOffer from 'UiKit/components/VCard/VCardOffer.vue';
import { urlOfferSingle } from 'InvestCommon/domain/config/links';
import VWalletTokensAndTransactions from 'InvestCommon/shared/components/VWalletTokensAndTransactions.vue';

const {
  cryptoItems,
  getPricesState,
  durationSec,
  isLoading,
  // categories
  categorySlices,
  categoryDonutData,
  categoryColors,
  // assets
  offerSlices,
  offerDonutData,
  offerColors,
  topfindedoffer,
  // wallet
  getEvmWalletState,
  walletTokensTop5,
  getWalletState,
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
          :side-items="categorySlices.map((d, idx) => ({ label: d.label, amount: d.amount, percent: d.percent, color: categoryColors[idx] }))"
          :show-amount="true"
          :show-percent="true"
          :is-loading="isLoading"
        />

        <CardDonutUnified
          class-name="assets-diversification-card"
          aria-label="Assets Diversification"
          title="Assets Diversification"
          subtitle="Investment distribution by offers (%)"
          :loading="false"
          :data="offerDonutData"
          :colors="offerColors"
          :side-items="offerDonutData.map((d, idx) => ({ label: d.name, percent: d.percent, color: offerColors[idx] }))"
          :show-amount="false"
          :show-percent="true"
          :is-loading="isLoading"
        />
      </div>
      <div class="dashboard-summary__grid-offer">
        <VWalletTokensAndTransactions
          :balances="balances"
          :tables="tables"
        />
        <VCardOffer
          v-if="topfindedoffer"
          :offer="topfindedoffer"
          :href="urlOfferSingle(topfindedoffer.slug)"
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
        grid-template-columns: 2fr 2fr;
        gap: 24px;
        margin-top: 40px;

      @media screen and (width < $tablet){
        grid-template-columns: 1fr;
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
}
</style>