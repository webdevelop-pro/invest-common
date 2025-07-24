<script setup lang="ts">
import { useFormCreateNewProfile } from './store/useFormCreateNewProfile';
import { useGlobalLoader } from 'InvestCommon/store/useGlobalLoader';
import { defineAsyncComponent, hydrateOnVisible } from 'vue';
import VLayoutForm from 'InvestCommon/shared/layouts/VLayoutForm.vue';

const VFormCreateProfileSelectType = defineAsyncComponent({
  loader: () => import('./components/VFormCreateProfileSelectType.vue'),
  hydrate: hydrateOnVisible(),
});
const VFormProfileEntity = defineAsyncComponent({
  loader: () => import('./components/VFormProfileEntity.vue'),
  hydrate: hydrateOnVisible(),
});
const VFormProfileSDIRA = defineAsyncComponent({
  loader: () => import('./components/VFormProfileSDIRA.vue'),
  hydrate: hydrateOnVisible(),
});
const VFormProfileSolo = defineAsyncComponent({
  loader: () => import('./components/VFormProfileSolo.vue'),
  hydrate: hydrateOnVisible(),
});
const VFormProfileTrust = defineAsyncComponent({
  loader: () => import('./components/VFormProfileTrust.vue'),
  hydrate: hydrateOnVisible(),
});

const globalLoader = useGlobalLoader();
globalLoader.hide();

const formComposable = useFormCreateNewProfile();
const {
  backButtonText, breadcrumbs, isLoading, isDisabledButton,
  modelData, PROFILE_TYPES, selectedType, schemaBackend, errorData,
} = formComposable;

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
        <VFormProfileEntity
          v-if="selectedType === PROFILE_TYPES.ENTITY"
          ref="entityFormChild"
          :model-data="modelData"
          :loading="isLoading"
          :schema-backend="schemaBackend"
          :error-data="errorData"
        />
        <VFormProfileSDIRA
          v-if="selectedType === PROFILE_TYPES.SDIRA"
          ref="sdiraFormChild"
          :model-data="modelData"
          :loading="isLoading"
          :schema-backend="schemaBackend"
          :error-data="errorData"
        />
        <VFormProfileSolo
          v-if="selectedType === PROFILE_TYPES.SOLO401K"
          ref="soloFormChild"
          :model-data="modelData"
          :loading="isLoading"
          :schema-backend="schemaBackend"
          :error-data="errorData"
        />
        <VFormProfileTrust
          v-if="selectedType === PROFILE_TYPES.TRUST"
          ref="trustFormChild"
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
.view-create-new-profile {
  width: 100%;

  &__header {
    margin-bottom: 40px;
    min-height: 75px;
  }
}
</style>
