<script setup lang="ts">
import VAccreditationAlert from 'InvestCommon/features/accreditation/VAccreditationAlert.vue';
import VKycAlert from 'InvestCommon/features/kyc/VKycAlert.vue';
import DashboardWalletAlert from 'InvestCommon/features/wallet/components/DashboardWalletAlert.vue';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
import DashboardTopInfoRight from './DashboardTopInfoRight.vue';

type DashboardPageHeaderBanner = {
  type: 'kyc' | 'accreditation' | 'wallet';
  variant: 'error' | 'info';
  title: string;
  description: string;
  buttonText?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
};

defineProps<{
  showPerformanceCards: boolean;
  verificationBanner: DashboardPageHeaderBanner | null;
  walletBanner: DashboardPageHeaderBanner | null;
  isWalletAlertLoading: boolean;
}>();

const emit = defineEmits<{
  kycBannerClick: [];
  kycBannerDescriptionAction: [event: Event];
  walletBannerClick: [];
  walletBannerContactUsClick: [event: Event];
}>();
</script>

<template>
  <div class="dashboard-page-header-right">
    <div
      v-if="verificationBanner || walletBanner || isWalletAlertLoading"
      class="dashboard-page-header-right__alerts"
    >
      <VKycAlert
        v-if="verificationBanner?.type === 'kyc'"
        :variant="verificationBanner.variant"
        :title="verificationBanner.title"
        :description="verificationBanner.description"
        :button-text="verificationBanner.buttonText"
        :is-loading="verificationBanner.isLoading"
        :is-disabled="verificationBanner.isDisabled"
        @action="emit('kycBannerClick')"
        @description-action="emit('kycBannerDescriptionAction', $event)"
      />
      <VAccreditationAlert
        v-if="verificationBanner?.type === 'accreditation'"
        :variant="verificationBanner.variant"
        :title="verificationBanner.title"
        :description="verificationBanner.description"
        :button-text="verificationBanner.buttonText"
      />
      <div
        v-if="isWalletAlertLoading"
        class="dashboard-page-header-right__wallet-skeleton"
        data-testid="wallet-alert-skeleton"
      >
        <VSkeleton
          height="72px"
          width="100%"
        />
      </div>
      <DashboardWalletAlert
        v-else-if="walletBanner?.type === 'wallet'"
        :show="true"
        :variant="walletBanner.variant"
        :alert-text="walletBanner.description"
        :alert-title="walletBanner.title"
        :button-text="walletBanner.buttonText"
        @click="emit('walletBannerClick')"
        @contact-us-click="emit('walletBannerContactUsClick', $event)"
      />
    </div>

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

  &__actions {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 16px;
  }

  &__alerts {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__stats {
    width: 100%;
  }

  &__wallet-skeleton {
    width: 100%;
  }

  @media screen and (max-width: $desktop-md) {
    &__actions {
      justify-content: flex-start;
    }
  }
}
</style>
