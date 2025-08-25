<script setup lang="ts">
import { computed } from 'vue';
import { useVFormProfileSolo } from './logic/useVFormProfileSolo';
import VFormPartialPersonalInformation from 'InvestCommon/components/forms/VFormPartialPersonalInformation.vue';
import VFormPartialPlanInformation from './VFormPartialPlanInformation.vue';

const props = defineProps({
  modelData: Object,
  errorData: Object,
  schemaBackend: Object,
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
  onValidate,
  personalFormRef,
  planFormRef,
} = useVFormProfileSolo();

defineExpose({
  model,
  isValid,
  onValidate,
  personalFormRef,
  planFormRef,
});
</script>

<template>
  <div class="VFormProfileSolo v-form-profile-solo">
    <div class="v-form-profile-solo__subtitle is--h3__title ">
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
    <VFormPartialPlanInformation
      ref="planFormChild"
      :model-data="modelDataComputed"
      :loading="loadingComputed"
      :schema-backend="schemaBackendComputed"
      :error-data="errorDataComputed"
      :show-document="showDocument"
    />
  </div>
</template>

<style lang="scss">
.v-form-profile-solo {
  display: flex;
  flex-direction: column;
  width: 100%;

  &__subtitle {
    margin-bottom: 20px;
    margin-top: 12px;
  }
}
</style>
