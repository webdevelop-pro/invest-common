<script setup lang="ts">
import { useVFormProfileSolo } from './logic/useVFormProfileSolo';
import VFormPartialPersonalInformation from 'InvestCommon/components/forms/VFormPartialPersonalInformation.vue';
import VFormPartialPlanInformation from './VFormPartialPlanInformation.vue';

const props = defineProps({
  modelData: Object,
  errorData: Object,
  schemaBackend: Object,
  loading: Boolean,
});

const {
  model,
  isValid,
  onValidate,
  personalFormRef,
  planFormRef,
} = useVFormProfileSolo(props.modelData);

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
      :model-data="modelData"
      ein
      :loading="loading"
      :schema-backend="schemaBackend"
      :error-data="errorData"
    />
    <VFormPartialPlanInformation
      ref="planFormChild"
      :model-data="modelData"
      :loading="loading"
      :schema-backend="schemaBackend"
      :error-data="errorData"
      show-document
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
