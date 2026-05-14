<script setup lang="ts">
import { computed } from 'vue';
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

const props = defineProps<{
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

const showAlertSection = computed(() => (
  props.isWalletAlertLoading
  || props.kycAlertModel.show
  || props.walletAlertModel.show
  || props.accreditationAlertModel.show
));

const showAccreditationAlert = computed(() => (
  props.accreditationAlertModel.show
  && !props.walletAlertModel.show
  && !props.kycAlertModel.show
  && !props.isWalletAlertLoading
));
</script>

<template>
  <div class="dashboard-page-header-right">
    <div
      v-if="showAlertSection"
      class="dashboard-page-header-right__alerts"
    >
      <VKycAlert
        v-if="kycAlertModel.show"
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
        v-if="walletAlertModel.show"
        :variant="walletAlertModel.variant"
        :title="walletAlertModel.title"
        :description="walletAlertModel.description"
        :button-text="walletAlertModel.buttonText"
        :is-loading="walletAlertModel.isLoading"
        :is-disabled="walletAlertModel.isDisabled"
        @action="emit('walletBannerClick')"
        @description-action="emit('walletBannerDescriptionAction', $event)"
      />
      <VAccreditationAlert
        v-if="showAccreditationAlert"
        :variant="accreditationAlertModel.variant"
        :title="accreditationAlertModel.title"
        :description="accreditationAlertModel.description"
        :button-text="accreditationAlertModel.buttonText"
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
