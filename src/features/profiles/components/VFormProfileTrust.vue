<script setup lang="ts">
import { useVFormProfileTrust } from './logic/useVFormProfileTrust';
import VFormPartialPersonalInformation from 'InvestCommon/components/forms/VFormPartialPersonalInformation.vue';
import VFormPartialTrustInformation from './VFormPartialTrustInformation.vue';
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
} = useVFormProfileTrust(props.modelData);

defineExpose({
  model, isValid, onValidate,
});
</script>

<template>
  <div class="VFormProfileTrust v-form-profile-trust">
    <div class="v-form-profile-trust__subtitle is--h3__title ">
      Trustee Information
    </div>
    <VFormPartialPersonalInformation
      ref="personalFormChild"
      :model-data="modelData"
      ein
      :loading="loading"
      :schema-backend="schemaBackend"
      :error-data="errorData"
    />
    <VFormPartialTrustInformation
      ref="trustInfoFormChild"
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
      trust
      :loading="loading"
      :schema-backend="schemaBackend"
      :error-data="errorData"
    />
    <VFormPartialBeneficialOwnership
      ref="beneficialOwnershipFormChild"
      :model-data="modelData"
      trust
      :loading="loading"
      :schema-backend="schemaBackend"
      :error-data="errorData"
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
