<script setup lang="ts">
import { useGlobalLoader } from 'InvestCommon/store';
import VLayoutForm from 'InvestCommon/shared/layouts/VLayoutForm.vue';
import { useFormTrustInformation } from './store/useFormTrustInformation';
import VFormPartialTrustInformation from './components/VFormPartialTrustInformation.vue';

const globalLoader = useGlobalLoader();
globalLoader.hide();

const {
  backButtonText, breadcrumbs, isLoading, isDisabledButton,
  modelData, schemaBackend, errorData, handleSave,
} = useFormTrustInformation();
</script>

<template>
  <div class="ViewDashboardTrustInformation view-dashboard-trust-information is--no-margin">
    <VLayoutForm
      :button-text="backButtonText"
      :breadcrumbs="breadcrumbs"
      :is-disabled-button="isDisabledButton"
      :is-loading="isLoading"
      @save="handleSave"
    >
      <div class="view-dashboard-trust-information__header is--h1__title">
        Trust Information
      </div>
      <div class="view-dashboard-trust-information__content">
        <VFormPartialTrustInformation
          ref="trustInformationFormChild"
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
.view-dashboard-trust-information {
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
