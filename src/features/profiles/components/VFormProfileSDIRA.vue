<script setup lang="ts">
import { computed } from 'vue';
import { useVFormProfileSDIRA } from './logic/useVFormProfileSDIRA';
import VFormPartialPersonalInformation from 'InvestCommon/components/forms/VFormPartialPersonalInformation.vue';
import VFormPartialCustodian from './VFormPartialCustodian.vue';

const props = defineProps({
  modelData: Object,
  errorData: Object,
  schemaBackend: Object,
  loading: Boolean,
  showSSN: Boolean,
});

const modelDataComputed = computed(() => props.modelData);
const errorDataComputed = computed(() => props.errorData);
const schemaBackendComputed = computed(() => props.schemaBackend);
const loadingComputed = computed(() => props.loading);

const {
  model, isValid, onValidate, personalFormRef, custodianFormRef,
} = useVFormProfileSDIRA();

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
      :model-data="modelDataComputed"
      ein
      :loading="loadingComputed"
      :schema-backend="schemaBackendComputed"
      :error-data="errorDataComputed"
      :show-ssn="showSSN"
    />
    <VFormPartialCustodian
      ref="custodianFormChild"
      :model-data="modelDataComputed"
      :loading="loadingComputed"
      :schema-backend="schemaBackendComputed"
      :error-data="errorDataComputed"
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
