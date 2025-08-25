<script setup lang="ts">
import { PropType, computed } from 'vue';
import { useVFormProfileTrust } from './logic/useVFormProfileTrust';
import VFormPartialPersonalInformation from 'InvestCommon/components/forms/VFormPartialPersonalInformation.vue';
import VFormPartialTrustInformation from './VFormPartialTrustInformation.vue';
import VFormPartialBusinessController from './VFormPartialBusinessController.vue';
import VFormPartialBeneficialOwnership from './VFormPartialBeneficialOwnership.vue';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';

const props = defineProps({
  modelData: Object as PropType<Record<string, unknown>>,
  errorData: Object,
  schemaBackend: Object as PropType<JSONSchemaType<unknown> | undefined>,
  loading: Boolean,
  showDocument: Boolean,
  showSSN: Boolean,
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
  trustInfoFormRef,
  businessControllerRef,
  beneficialOwnershipRef,
} = useVFormProfileTrust();

defineExpose({
  model,
  isValid,
  onValidate,
  personalFormRef,
  trustInfoFormRef,
  businessControllerRef,
  beneficialOwnershipRef,
});
</script>

<template>
  <div class="VFormProfileTrust v-form-profile-trust">
    <div class="v-form-profile-trust__subtitle is--h3__title ">
      Trustee Information
    </div>
    <VFormPartialPersonalInformation
      ref="personalFormChild"
      :model-data="modelDataComputed"
      ein
      :loading="loadingComputed"
      :schema-backend="schemaBackendComputed"
      :error-data="errorDataComputed"
      :show-ssn="showSSN"
    />
    <VFormPartialTrustInformation
      ref="trustInfoFormChild"
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
      trust
      :loading="loadingComputed"
      :schema-backend="schemaBackendComputed"
      :error-data="errorDataComputed"
    />
    <VFormPartialBeneficialOwnership
      ref="beneficialOwnershipFormChild"
      :model-data="modelDataComputed"
      trust
      :loading="loadingComputed"
      :schema-backend="schemaBackendComputed"
      :error-data="errorDataComputed"
    />
  </div>
</template>

<style lang="scss">
.v-form-profile-trust {
  display: flex;
  flex-direction: column;
  width: 100%;

  &__subtitle {
    margin-bottom: 20px;
    margin-top: 12px;
  }
}
</style>
