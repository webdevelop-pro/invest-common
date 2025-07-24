<script setup lang="ts">
import { useGlobalLoader } from 'InvestCommon/store/useGlobalLoader';
import { storeToRefs } from 'pinia';
import VLayoutForm from 'InvestCommon/shared/layouts/VLayoutForm.vue';
import { useFormEntityInformation } from './store/useFormEntityInformation';
import VFormPartialEntityInformation from './components/VFormPartialEntityInformation.vue';

const globalLoader = useGlobalLoader();
globalLoader.hide();

const formStore = useFormEntityInformation();
const {
  backButtonText, breadcrumbs, isLoading, isDisabledButton,
  modelData, schemaBackend, errorData,
} = storeToRefs(formStore);

const handleSave = () => {
  formStore.handleSave();
};
</script>

<template>
  <div class="ViewDashboardEntityInformation view-dashboard-entity-information is--no-margin">
    <VLayoutForm
      :button-text="backButtonText"
      :breadcrumbs="breadcrumbs"
      :is-disabled-button="isDisabledButton"
      :is-loading="isLoading"
      @save="handleSave"
    >
      <div class="view-dashboard-entity-information__header is--h1__title">
        Entity Information
      </div>
      <div class="view-dashboard-entity-information__content">
        <VFormPartialEntityInformation
          ref="entityInformationFormChild"
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
.view-dashboard-entity-information {
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
