<script setup lang="ts">
import { computed } from 'vue';
import { useVFormProfileEntity } from './logic/useVFormProfileEntity';
import VFormPartialPersonalInformation from 'InvestCommon/components/forms/VFormPartialPersonalInformation.vue';
import VFormPartialEntityInformation from './VFormPartialEntityInformation.vue';
import VFormPartialBusinessController from './VFormPartialBusinessController.vue';
import VFormPartialBeneficialOwnership from './VFormPartialBeneficialOwnership.vue';

const props = defineProps({
  modelData: Object,
  errorData: Object,
  schemaBackend: Object,
  loading: Boolean,
  showDocument: Boolean,
});

const modelDataComputed = computed(() => props.modelData);
const errorDataComputed = computed(() => props.errorData);
const schemaBackendComputed = computed(() => props.schemaBackend);
const loadingComputed = computed(() => props.loading);

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
      :model-data="modelDataComputed"
      ein
      :loading="loadingComputed"
      :schema-backend="schemaBackendComputed"
      :error-data="errorDataComputed"
    />
    <VFormPartialEntityInformation
      ref="entityInfoFormChild"
      :model-data="modelDataComputed"
      :loading="loadingComputed"
      :schema-backend="schemaBackendComputed"
      :error-data="errorDataComputed"
      :show-document="showDocument"
    />
    <VFormPartialBusinessController
      ref="businessControllerFormChild"
      :model-data="modelDataComputed"
      :personal-data="controllerData"
      :loading="loadingComputed"
      :schema-backend="schemaBackendComputed"
      :error-data="errorDataComputed"
    />
    <VFormPartialBeneficialOwnership
      ref="beneficialOwnershipFormChild"
      :model-data="modelDataComputed"
      :loading="loadingComputed"
      :schema-backend="schemaBackendComputed"
      :error-data="errorDataComputed"
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
