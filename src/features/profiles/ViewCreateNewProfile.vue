<script setup lang="ts">
import { useFormCreateNewProfile } from './store/useFormCreateNewProfile';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { defineAsyncComponent, ref, watch, nextTick } from 'vue';
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

// Enhanced loading state for profile switching
const isProfileSwitching = ref(false);
const previousSelectedType = ref<string>('');
const showSkeleton = ref(false);

// Watch for profile type changes to show loading skeleton
watch(selectedType, async (newType, oldType) => {
  // Only trigger switching if we have a previous type and it's different
  if (oldType && oldType !== newType) {
    isProfileSwitching.value = true;
    showSkeleton.value = true;
    
    // Wait for the next tick to ensure smooth transition
    await nextTick();
    
    // Add a small delay to ensure the skeleton is visible
    setTimeout(() => {
      showSkeleton.value = false;
      isProfileSwitching.value = false;
    }, 150);
  }
  
  previousSelectedType.value = newType;
}, { immediate: true });

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
        <Transition
          name="profile-switch"
          mode="out-in"
        >
          <VFormPartialPersonalInformationSkeleton 
            v-if="showSkeleton" 
            key="skeleton"
          />
          
          <!-- Show profile forms when not switching -->
          <div
            v-else-if="selectedType"
            class="view-create-new-profile__forms"
          >
            <Transition
              name="profile-form"
              mode="out-in"
            >
              <VFormProfileEntity
                v-if="selectedType === PROFILE_TYPES.ENTITY"
                key="entity"
                ref="entityFormChild"
                :model-data="modelData"
                :loading="isLoading"
                :schema-backend="schemaBackend || {}"
                :error-data="errorData || {}"
                show-document
                show-ssn
              />
              <VFormProfileSDIRA
                v-else-if="selectedType === PROFILE_TYPES.SDIRA"
                key="sdira"
                ref="sdiraFormChild"
                :model-data="modelData"
                :loading="isLoading"
                :schema-backend="schemaBackend || {}"
                :error-data="errorData || {}"
                show-ssn
              />
              <VFormProfileSolo
                v-else-if="selectedType === PROFILE_TYPES.SOLO401K"
                key="solo"
                ref="soloFormChild"
                :model-data="modelData"
                :loading="isLoading"
                :schema-backend="schemaBackend || {}"
                :error-data="errorData || {}"
                show-document
                show-ssn
              />
              <VFormProfileTrust
                v-else-if="selectedType === PROFILE_TYPES.TRUST"
                key="trust"
                ref="trustFormChild"
                :model-data="modelData"
                :loading="isLoading"
                :schema-backend="schemaBackend || {}"
                :error-data="errorData || {}"
                show-document
                show-ssn
              />
            </Transition>
          </div>
        </Transition>
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

  &__forms {
    min-height: 100vh;
  }
}

// Smooth transitions for profile switching
.profile-switch-enter-active,
.profile-switch-leave-active,
.profile-form-enter-active,
.profile-form-leave-active {
  transition: all 0.3s ease-in-out;
}

.profile-switch-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.profile-switch-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.profile-form-enter-from {
  opacity: 0;
  transform: translateY(5px);
}

.profile-form-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
