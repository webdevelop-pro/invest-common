<script setup lang="ts">
import { useGlobalLoader } from 'InvestCommon/store/useGlobalLoader';
import { storeToRefs } from 'pinia';
import VLayoutForm from 'InvestCommon/shared/layouts/VLayoutForm.vue';
import { useFormCustodianInformation } from './store/useFormCustodianInformation';
import VFormPartialCustodian from './components/VFormPartialCustodian.vue';

const globalLoader = useGlobalLoader();
globalLoader.hide();

const formStore = useFormCustodianInformation();
const {
  backButtonText, breadcrumbs, isLoading, isDisabledButton,
  modelData, schemaBackend, errorData, isLoadingFields,
} = storeToRefs(formStore);

const handleSave = () => {
  formStore.handleSave();
};
</script>

<template>
  <div class="ViewDashboardCustodianInformation view-dashboard-custodian-information is--no-margin">
    <VLayoutForm
      :button-text="backButtonText"
      :breadcrumbs="breadcrumbs"
      :is-disabled-button="isDisabledButton"
      :is-loading="isLoading"
      @save="handleSave"
    >
      <div class="view-dashboard-custodian-information__header is--h1__title">
        Custodian Information
      </div>
      <div class="view-dashboard-custodian-information__content">
        <VFormPartialCustodian
          ref="custodianInformationFormChild"
          :model-data="modelData"
          :schema-backend="schemaBackend"
          :error-data="errorData"
          :loading="isLoadingFields"
        />
      </div>
    </VLayoutForm>
  </div>
</template>

<style lang="scss">
.view-dashboard-custodian-information {
  width: 100%;

  &__header {
    margin-bottom: 40px;
    min-height: 75px;
  }
}
</style>
