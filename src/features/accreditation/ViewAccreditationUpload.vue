<script setup lang="ts">
import { useGlobalLoader } from 'InvestCommon/store/useGlobalLoader';
import VLayoutForm from 'InvestCommon/shared/layouts/VLayoutForm.vue';
import FormAccreditationUploadFiles from './components/VFormAccreditationUploadFiles.vue';
import { storeToRefs } from 'pinia';
import { useAccreditationUpload } from './store/useAccreditationUpload';

const globalLoader = useGlobalLoader();
globalLoader.hide();

const accreditationUploadStore = useAccreditationUpload();
const {
  backButtonText, breadcrumbs, isLoading, isDisabledButton,
} = storeToRefs(accreditationUploadStore);

const handleSave = () => {
  accreditationUploadStore.handleSave();
};
</script>

<template>
  <div class="ViewAccreditationUpload view-accreditationUpload is--no-margin">
    <VLayoutForm
      :button-text="backButtonText"
      :breadcrumbs="breadcrumbs"
      :is-disabled-button="isDisabledButton"
      :is-loading="isLoading"
      @save="handleSave"
    >
      <FormAccreditationUploadFiles />
    </VLayoutForm>
  </div>
</template>

<style lang="scss">
.view-accreditationUpload {
  width: 100%;
}
</style>
