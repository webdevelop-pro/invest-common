<script setup lang="ts">
import { useGlobalLoader } from 'InvestCommon/store/useGlobalLoader';
import VFormPartialPersonalInformation from 'InvestCommon/components/forms/VFormPartialPersonalInformation.vue';
import { storeToRefs } from 'pinia';
import VLayoutForm from 'InvestCommon/core/layouts/VLayoutForm.vue';
import { useFormPersonalInformation } from './store/useFormPersonalInformation';

const globalLoader = useGlobalLoader();
globalLoader.hide();

const formStore = useFormPersonalInformation();
const {
  backButtonText, breadcrumbs, isLoading, isDisabledButton,
  readOnly, modelData, schemaBackend, errorData,
} = storeToRefs(formStore);

const handleSave = () => {
  formStore.handleSave();
};
</script>

<template>
  <div class="ViewDashboardPersonalInformation view-dashboard-personal-information is--no-margin">
    <VLayoutForm
      :button-text="backButtonText"
      :breadcrumbs="breadcrumbs"
      :is-disabled-button="isDisabledButton"
      :is-loading="isLoading"
      @save="handleSave"
    >
      <div class="view-dashboard-personal-information__header is--h1__title">
        Personal Information
      </div>
      <div class="view-dashboard-personal-information__content">
        <VFormPartialPersonalInformation
          ref="personalFormChild"
          :read-only="readOnly"
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
.view-dashboard-personal-information {
  width: 100%;

  &__header {
    margin-bottom: 40px;
    min-height: 75px;
  }
}
</style>
