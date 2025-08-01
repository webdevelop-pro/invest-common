<script setup lang="ts">
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import VLayoutForm from 'InvestCommon/shared/layouts/VLayoutForm.vue';
import { useFormBusinessController } from './store/useFormBusinessController';
import VFormPartialBusinessController from './components/VFormPartialBusinessController.vue';

const globalLoader = useGlobalLoader();
globalLoader.hide();

const {
  backButtonText, breadcrumbs, isLoading, isDisabledButton,
  modelData, schemaBackend, errorData, handleSave,
} = useFormBusinessController();

const props = defineProps({
  trust: Boolean,
});

const title = props.trust ? 'Grantor Infotmation' : 'Business Controller Information';
</script>

<template>
  <div class="ViewDashboardBusinessController view-dashboard-business-controller is--no-margin">
    <VLayoutForm
      :button-text="backButtonText"
      :breadcrumbs="breadcrumbs"
      :is-disabled-button="isDisabledButton"
      :is-loading="isLoading"
      @save="handleSave"
    >
      <div class="view-dashboard-business-controller__header is--h1__title">
        {{ title }}
      </div>
      <div class="view-dashboard-business-controller__content">
        <VFormPartialBusinessController
          ref="businessControllerFormChild"
          :trust="trust"
          :personal-data="modelData?.business_controller"
          :loading="isLoading"
          :schema-backend="schemaBackend"
          :error-data="errorData"
        />
      </div>
    </VLayoutForm>
  </div>
</template>

<style lang="scss">
.view-dashboard-business-controller {
  width: 100%;

  &__header {
    margin-bottom: 40px;
    min-height: 75px;
  }
}
</style>
