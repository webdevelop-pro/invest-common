<script setup lang="ts">
import { PropType, type Component } from 'vue';
import DashboardPageHeaderLeft from './DashboardPageHeaderLeft.vue';
import DashboardPageHeaderRight from './DashboardPageHeaderRight.vue';
import { DashboardTabTypes } from '../utils';
import { useDashboardPageHeader } from '../composables/useDashboardPageHeader';

defineProps({
  activeTab: {
    type: String as PropType<DashboardTabTypes>,
    required: true,
  },
  tabTopLeftComponents: {
    type: Object as PropType<Record<DashboardTabTypes, Component>>,
    required: true,
  },
});

const {
  onInfoCtaClick,
  onKycBannerClick,
  onKycBannerDescriptionAction,
  onWalletBannerClick,
  onWalletBannerContactUsClick,
  isWalletAlertLoading,
  showPerformanceCards,
  verificationBanner,
  walletBanner,
} = useDashboardPageHeader();
</script>

<template>
  <section class="DashboardPageHeader dashboard-page-header">
    <DashboardPageHeaderLeft
      :active-tab="activeTab"
      :tab-top-left-components="tabTopLeftComponents"
      class="dashboard-page-header__info"
      @info-cta-click="onInfoCtaClick"
    />

    <DashboardPageHeaderRight
      :wallet-banner="walletBanner"
      :is-wallet-alert-loading="isWalletAlertLoading"
      :show-performance-cards="showPerformanceCards"
      :verification-banner="verificationBanner"
      class="dashboard-page-header__aside"
      @kyc-banner-click="onKycBannerClick"
      @kyc-banner-description-action="onKycBannerDescriptionAction"
      @wallet-banner-click="onWalletBannerClick"
      @wallet-banner-contact-us-click="onWalletBannerContactUsClick"
    />
  </section>
</template>

<style lang="scss">
.dashboard-page-header {
  display: grid;
  grid-template-columns: minmax(0, 300px) minmax(0, 1fr);
  gap: 32px 80px;
  align-items: center;

  &__aside {
    width: 100%;
    min-width: 0;
  }

  &__info {
    width: 100%;
    min-width: 0;
  }

  @media screen and (max-width: $desktop-md) {
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
  }
}
</style>
