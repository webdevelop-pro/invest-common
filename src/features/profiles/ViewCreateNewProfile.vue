<script setup lang="ts">
import { useFormCreateNewProfile } from './store/useFormCreateNewProfile';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { defineAsyncComponent, ref, watch } from 'vue';
import VLayoutForm from 'InvestCommon/shared/layouts/VLayoutForm.vue';
import VFormCreateProfileSelectType from './components/VFormCreateProfileSelectType.vue';
import VFormPartialPersonalInformationSkeleton from 'InvestCommon/components/forms/VFormPartialPersonalInformationSkeleton.vue';

const VFormProfileEntity = defineAsyncComponent({
  loader: () => import('./components/VFormProfileEntity.vue'),
  loadingComponent: VFormPartialPersonalInformationSkeleton,
});
const VFormProfileSDIRA = defineAsyncComponent({
  loader: () => import('./components/VFormProfileSDIRA.vue'),
  loadingComponent: VFormPartialPersonalInformationSkeleton,
});
const VFormProfileSolo = defineAsyncComponent({
  loader: () => import('./components/VFormProfileSolo.vue'),
  loadingComponent: VFormPartialPersonalInformationSkeleton,
});
const VFormProfileTrust = defineAsyncComponent({
  loader: () => import('./components/VFormProfileTrust.vue'),
  loadingComponent: VFormPartialPersonalInformationSkeleton,
});

const globalLoader = useGlobalLoader();
globalLoader.hide();

const formComposable = useFormCreateNewProfile();
const {
  backButtonText, breadcrumbs, isLoading, isDisabledButton,
  modelData, PROFILE_TYPES, selectedType, schemaBackend, errorData,
} = formComposable;

// Add loading state for profile switching
const isProfileSwitching = ref(false);

// Watch for profile type changes to show loading skeleton
watch(selectedType, () => {
  isProfileSwitching.value = true;
  // Hide loading after a short delay to ensure smooth transition
  setTimeout(() => {
    isProfileSwitching.value = false;
  }, 100);
});

const handleSave = () => {
  formComposable.handleSave();
};
</script>

<template>
  <div class="ViewCreateNewProfile view-create-new-profile is--no-margin">
    <VLayoutForm
      :button-text="backButtonText"
      :breadcrumbs="breadcrumbs"
      :is-disabled-button="isDisabledButton"
      :is-loading="isLoading"
      @save="handleSave"
    >
      <div class="view-create-new-profile__header is--h1__title">
        Set Up Investment Account
      </div>
      <div class="view-create-new-profile__content">
        <VFormCreateProfileSelectType
          ref="selectTypeFormChild"
        />
        
        <!-- Show loading skeleton during profile switching -->
        <VFormPartialPersonalInformationSkeleton 
          v-if="isProfileSwitching" 
        />
        
        <!-- Show profile forms when not switching -->
        <template v-else>
          <VFormProfileEntity
            v-if="selectedType === PROFILE_TYPES.ENTITY"
            ref="entityFormChild"
            :model-data="modelData"
            :loading="isLoading"
            :schema-backend="schemaBackend || {}"
            :error-data="errorData || {}"
            show-document
          />
          <VFormProfileSDIRA
            v-if="selectedType === PROFILE_TYPES.SDIRA"
            ref="sdiraFormChild"
            :model-data="modelData"
            :loading="isLoading"
            :schema-backend="schemaBackend || {}"
            :error-data="errorData || {}"
          />
          <VFormProfileSolo
            v-if="selectedType === PROFILE_TYPES.SOLO401K"
            ref="soloFormChild"
            :model-data="modelData"
            :loading="isLoading"
            :schema-backend="schemaBackend || {}"
            :error-data="errorData || {}"
            show-document
          />
          <VFormProfileTrust
            v-if="selectedType === PROFILE_TYPES.TRUST"
            ref="trustFormChild"
            :model-data="modelData"
            :loading="isLoading"
            :schema-backend="schemaBackend || {}"
            :error-data="errorData || {}"
            show-document
          />
        </template>
      </div>
    </VLayoutForm>
  </div>
</template>

<style lang="scss">
.view-create-new-profile {
  width: 100%;

  &__header {
    margin-bottom: 40px;
    min-height: 75px;
  }
}
</style>
