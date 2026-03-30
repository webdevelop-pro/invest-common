<script setup lang="ts">
import VAccreditationAlert from 'InvestCommon/features/accreditation/VAccreditationAlert.vue';
import VKycAlert from 'InvestCommon/features/kyc/VKycAlert.vue';
import DashboardTopInfoRight from './DashboardTopInfoRight.vue';

type DashboardPageHeaderBanner = {
  type: 'kyc' | 'accreditation';
  variant: 'error' | 'info';
  title: string;
  description: string;
  buttonText?: string;
};

defineProps<{
  showPerformanceCards: boolean;
  verificationBanner: DashboardPageHeaderBanner | null;
}>();
</script>

<template>
  <div class="dashboard-page-header-right">
    <VAccreditationAlert
      v-if="verificationBanner?.type === 'accreditation'"
      :variant="verificationBanner.variant"
      :title="verificationBanner.title"
      :description="verificationBanner.description"
      :button-text="verificationBanner.buttonText"
    />
    <VKycAlert
      v-else-if="verificationBanner?.type === 'kyc'"
      :variant="verificationBanner.variant"
      :title="verificationBanner.title"
      :description="verificationBanner.description"
      :button-text="verificationBanner.buttonText"
    />

    <DashboardTopInfoRight
      v-else-if="showPerformanceCards"
      class="dashboard-page-header-right__stats"
    />
  </div>
</template>

<style lang="scss">
.dashboard-page-header-right {
  width: 100%;
  min-width: 0;

  &__stats {
    width: 100%;
  }
}
</style>
