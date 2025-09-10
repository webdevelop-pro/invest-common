<script setup lang="ts">
import { useVFormProfileEntity } from './logic/useVFormProfileEntity';
import VFormPartialPersonalInformation from 'InvestCommon/shared/components/forms/VFormPartialPersonalInformation.vue';
import VFormPartialEntityInformation from './VFormPartialEntityInformation.vue';
import VFormPartialBusinessController from './VFormPartialBusinessController.vue';
import VFormPartialBeneficialOwnership from './VFormPartialBeneficialOwnership.vue';

defineProps({
  modelData: Object,
  errorData: Object,
  schemaBackend: Object,
  loading: Boolean,
  isEditMode: Boolean,
});

// pass props directly in template

const {
  model,
  isValid,
  controllerData,
  onValidate,
  personalFormRef,
  entityInfoFormRef,
  businessControllerRef,
  beneficialOwnershipRef,
} = useVFormProfileEntity();

defineExpose({
  model,
  isValid,
  onValidate,
  personalFormRef,
  entityInfoFormRef,
  businessControllerRef,
  beneficialOwnershipRef,
});
</script>

<template>
  <div class="VFormProfileEntity v-form-profile-entity">
    <div class="v-form-profile-entity__subtitle is--h3__title ">
      Personal Information
    </div>
    <VFormPartialPersonalInformation
      ref="personalFormChild"
      :model-data="modelData"
      ein
      :loading="loading"
      :schema-backend="schemaBackend"
      :error-data="errorData"
      :is-edit-mode="isEditMode"
    />
    <VFormPartialEntityInformation
      ref="entityInfoFormChild"
      :model-data="modelData"
      :loading="loading"
      :schema-backend="schemaBackend"
      :error-data="errorData"
      :is-edit-mode="isEditMode"
    />
    <VFormPartialBusinessController
      ref="businessControllerFormChild"
      :model-data="modelData"
      :personal-data="controllerData"
      :loading="loading"
      :schema-backend="schemaBackend"
      :error-data="errorData"
      :is-edit-mode="isEditMode"
    />
    <VFormPartialBeneficialOwnership
      ref="beneficialOwnershipFormChild"
      :model-data="modelData"
      :loading="loading"
      :schema-backend="schemaBackend"
      :error-data="errorData"
      :is-edit-mode="isEditMode"
    />
  </div>
</template>

<style lang="scss">
.v-form-profile-entity {
  display: flex;
  flex-direction: column;
  width: 100%;

  &__subtitle {
    margin-bottom: 20px;
    margin-top: 12px;
  }
}
</style>
