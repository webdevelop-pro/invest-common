<script setup lang="ts">
import VAccreditationAlert from 'InvestCommon/features/accreditation/VAccreditationAlert.vue';
import VKycAlert from 'InvestCommon/features/kyc/VKycAlert.vue';
import DashboardWalletAlert from 'InvestCommon/features/wallet/components/DashboardWalletAlert.vue';
import DashboardTopInfoRight from './DashboardTopInfoRight.vue';

type AlertModel = {
  show: boolean;
  variant: 'error' | 'info';
  title?: string;
  description?: string;
  buttonText?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
};

defineProps<{
  showPerformanceCards: boolean;
  kycAlertModel: AlertModel;
  isKycDataLoading: boolean;
  accreditationAlertModel: AlertModel;
  isAccreditationDataLoading: boolean;
  walletAlertModel: AlertModel;
  isWalletAlertLoading: boolean;
}>();

const emit = defineEmits<{
  kycBannerClick: [];
  kycBannerDescriptionAction: [event: Event];
  accreditationBannerClick: [];
  accreditationBannerDescriptionAction: [event: Event];
  walletBannerClick: [];
  walletBannerDescriptionAction: [event: Event];
}>();
</script>

<template>
  <div class="dashboard-page-header-right">
    <div
      v-if="isKycDataLoading || isAccreditationDataLoading || kycAlertModel.show || accreditationAlertModel.show || walletAlertModel.show"
      class="dashboard-page-header-right__alerts"
    >
      <VKycAlert
        v-if="isKycDataLoading || kycAlertModel.show"
        :variant="kycAlertModel.variant"
        :title="kycAlertModel.title"
        :description="kycAlertModel.description"
        :button-text="kycAlertModel.buttonText"
        :is-loading="isKycDataLoading"
        :is-disabled="kycAlertModel.isDisabled"
        @action="emit('kycBannerClick')"
        @description-action="emit('kycBannerDescriptionAction', $event)"
      />
      <DashboardWalletAlert
        v-if="walletAlertModel.show || isWalletAlertLoading"
        :variant="walletAlertModel.variant"
        :title="walletAlertModel.title"
        :description="walletAlertModel.description"
        :button-text="walletAlertModel.buttonText"
        :is-loading="walletAlertModel.isLoading || isWalletAlertLoading"
        :is-disabled="walletAlertModel.isDisabled"
        @action="emit('walletBannerClick')"
        @description-action="emit('walletBannerDescriptionAction', $event)"
      />
      <VAccreditationAlert
        v-if="(accreditationAlertModel.show || isAccreditationDataLoading) && (!walletAlertModel.show && !kycAlertModel.show && !isWalletAlertLoading)"
        :variant="accreditationAlertModel.variant"
        :title="accreditationAlertModel.title"
        :description="accreditationAlertModel.description"
        :button-text="accreditationAlertModel.buttonText"
        :is-loading="isAccreditationDataLoading"
        :is-disabled="accreditationAlertModel.isDisabled"
        @action="emit('accreditationBannerClick')"
        @description-action="emit('accreditationBannerDescriptionAction', $event)"
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

  @media screen and (max-width: $desktop-md) {
    &__actions {
      justify-content: flex-start;
    }
  }
}
</style>
