<script setup lang="ts">
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { useFormFinancialInformationAndKyc } from './store/useFormFinancialInformationAndKyc';
import VLayoutForm from 'InvestCommon/shared/layouts/VLayoutForm.vue';
import VFormPartialPersonalInformation from 'InvestCommon/components/forms/VFormPartialPersonalInformation.vue';
import VFormPartialFinancialSituation from 'InvestCommon/components/forms/VFormPartialFinancialSituation.vue';
import VFormPartialInvestmentObjectives from 'InvestCommon/components/forms/VFormPartialInvestmentObjectives.vue';
import VFormPartialUnderstandingOfRisks from 'InvestCommon/components/forms/VFormPartialUnderstandingOfRisks.vue';

const globalLoader = useGlobalLoader();
globalLoader.hide();

const {
  backButtonText, breadcrumbs, isLoading, isDisabledButton,
  modelData, schemaBackend, errorData, handleSave,
} = useFormFinancialInformationAndKyc();

</script>

<template>
  <div class="ViewKYC view-kyc is--no-margin">
    <VLayoutForm
      :button-text="backButtonText"
      :breadcrumbs="breadcrumbs"
      :is-disabled-button="isDisabledButton"
      :is-loading="isLoading"
      @save="handleSave"
    >
      <div class="view-kyc__header is--h1__title">
        Your Financial Information and KYC
      </div>
      <p class="view-kyc__subheader is--subheading-2">
        Automated KYC process for investor onboarding. This is a one-time step.
      </p>
      <div class="view-kyc__content">
        <VFormPartialPersonalInformation
          ref="personalFormChild"
          :model-data="modelData"
          :loading="isLoading"
          :schema-backend="schemaBackend"
          :error-data="errorData"
        />
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
          :schema-backend="schemaBackend"
          :error-data="errorData"
        />
      </div>
    </VLayoutForm>
  </div>
</template>

<style lang="scss">
.view-kyc {
  width: 100%;

  &__header {
    margin-bottom: 20px;
  }

  &__subheader {
    color: $gray-80;
    margin-bottom: 40px;
  }

  &__subtitle {
    margin-top: 12px;
    margin-bottom: 20px;
  }
}
</style>
