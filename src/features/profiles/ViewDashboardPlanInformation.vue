<script setup lang="ts">
import { useGlobalLoader } from 'InvestCommon/store/useGlobalLoader';
import { storeToRefs } from 'pinia';
import VLayoutForm from 'InvestCommon/core/layouts/VLayoutForm.vue';
import { useFormPlanInformation } from './store/useFormPlanInformation';
import VFormPartialPlanInformation from './components/VFormPartialPlanInformation.vue';

const globalLoader = useGlobalLoader();
globalLoader.hide();

const formStore = useFormPlanInformation();
const {
  backButtonText, breadcrumbs, isLoading, isDisabledButton,
  modelData, schemaBackend, errorData,
} = storeToRefs(formStore);

const handleSave = () => {
  formStore.handleSave();
};
</script>

<template>
  <div class="ViewDashboardPlanInformation view-dashboard-plan-information is--no-margin">
    <VLayoutForm
      :button-text="backButtonText"
      :breadcrumbs="breadcrumbs"
      :is-disabled-button="isDisabledButton"
      :is-loading="isLoading"
      @save="handleSave"
    >
      <div class="view-dashboard-plan-information__header is--h1__title">
        Plan Information
      </div>
      <div class="view-dashboard-plan-information__content">
        <VFormPartialPlanInformation
          ref="planInformationFormChild"
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
.view-dashboard-plan-information {
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
