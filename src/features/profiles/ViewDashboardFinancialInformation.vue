<script setup lang="ts">
import { useGlobalLoader } from 'InvestCommon/store/useGlobalLoader';
import VLayoutForm from 'InvestCommon/shared/layouts/VLayoutForm.vue';
import { useFormFinancialInformation } from './store/useFormFinancialInformation';
import VFormPartialFinancialSituation from 'InvestCommon/components/forms/VFormPartialFinancialSituation.vue';
import VFormPartialInvestmentObjectives from 'InvestCommon/components/forms/VFormPartialInvestmentObjectives.vue';
import VFormPartialUnderstandingOfRisks from 'InvestCommon/components/forms/VFormPartialUnderstandingOfRisks.vue';

const globalLoader = useGlobalLoader();
globalLoader.hide();

const {
  backButtonText, breadcrumbs, isLoading, isDisabledButton,
  modelData, schemaBackend, errorData, handleSave,
} = useFormFinancialInformation();
</script>

<template>
  <div class="ViewDashboardFinancialInformation view-dashboard-financial-information is--no-margin">
    <VLayoutForm
      :button-text="backButtonText"
      :breadcrumbs="breadcrumbs"
      :is-disabled-button="isDisabledButton"
      :is-loading="isLoading"
      @save="handleSave"
    >
      <div class="view-dashboard-financial-information__header is--h1__title">
        Financial and Investment Information
      </div>
      <div class="view-dashboard-financial-information__content">
        <VFormPartialFinancialSituation
          ref="financialInfoFormChild"
          :model-data="modelData"
          :loading="isLoading"
          :schema-backend="schemaBackend"
          :error-data="errorData"
        />
        <VFormPartialInvestmentObjectives
          ref="investmentObjectivesFormChild"
          :model-data="modelData"
          :loading="isLoading"
          :schema-backend="schemaBackend"
          :error-data="errorData"
        />
        <VFormPartialUnderstandingOfRisks
          ref="understandingRisksFormChild"
          :model-data="modelData"
          :loading="isLoading"
          :error-data="errorData"
          consent-plaid
        />
      </div>
    </VLayoutForm>
  </div>
</template>

<style lang="scss">
.view-dashboard-financial-information {
  width: 100%;

  &__header {
    margin-bottom: 40px;
    min-height: 75px;
  }

  &__subtitle {
    margin-top: 12px;
    margin-bottom: 20px;
  }
}
</style>
