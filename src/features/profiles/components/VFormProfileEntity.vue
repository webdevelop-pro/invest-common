<script setup lang="ts">
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
});

const {
  model,
  isValid,
  controllerData,
  onValidate,
} = useVFormProfileEntity(props.modelData);

defineExpose({
  model, isValid, onValidate,
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
    />
    <VFormPartialEntityInformation
      ref="entityInfoFormChild"
      :model-data="modelData"
      :loading="loading"
      :schema-backend="schemaBackend"
      :error-data="errorData"
      show-document
    />
    <VFormPartialBusinessController
      ref="businessControllerFormChild"
      :model-data="modelData"
      :personal-data="controllerData"
      :loading="loading"
      :schema-backend="schemaBackend"
      :error-data="errorData"
    />
    <VFormPartialBeneficialOwnership
      ref="beneficialOwnershipFormChild"
      :model-data="modelData"
      :loading="loading"
      :schema-backend="schemaBackend"
      :error-data="errorData"
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
