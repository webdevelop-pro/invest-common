<script setup lang="ts">
import { useVFormProfileSDIRA } from './logic/useVFormProfileSDIRA';
import VFormPartialPersonalInformation from 'InvestCommon/components/forms/VFormPartialPersonalInformation.vue';
import VFormPartialCustodian from './VFormPartialCustodian.vue';

const props = defineProps({
  modelData: Object,
  errorData: Object,
  schemaBackend: Object,
  loading: Boolean,
});

const {
  model, isValid, onValidate, personalFormRef, custodianFormRef,
} = useVFormProfileSDIRA(props.modelData);

defineExpose({
  model, isValid, onValidate, personalFormRef, custodianFormRef,
});
</script>

<template>
  <div class="VFormProfileSDIRA v-form-profile-sdira">
    <div class="v-form-profile-sdira__subtitle is--h3__title ">
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
    <VFormPartialCustodian
      ref="custodianFormChild"
      :model-data="modelData"
      :loading="loading"
      :schema-backend="schemaBackend"
      :error-data="errorData"
    />
  </div>
</template>

<style lang="scss">
.v-form-profile-sdira {
  display: flex;
  flex-direction: column;
  width: 100%;

  &__subtitle {
    margin-bottom: 20px;
    margin-top: 12px;
  }
}
</style>
