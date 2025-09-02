<script setup lang="ts">
import { PropType, computed } from 'vue';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VFormRadio from 'UiKit/components/Base/VForm/VFormRadio.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VUploaderWithIds from 'InvestCommon/features/filer/VUploaderWithIds.vue';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { useVFormPartialPlanInformation, FormModelPlanInformation } from './logic/useVFormPartialPlanInformation';

const props = defineProps({
  modelData: Object as PropType<FormModelPlanInformation>,
  errorData: Object,
  schemaBackend: Object as PropType<JSONSchemaType<FormModelPlanInformation> | undefined>,
  loading: Boolean,
  showDocument: Boolean,
});

const modelDataComputed = computed(() => props.modelData);
const errorDataComputed = computed(() => props.errorData);
const schemaBackendComputed = computed(() => props.schemaBackend);
const loadingComputed = computed(() => props.loading);
const showDocumentComputed = computed(() => props.showDocument);

const {
  model,
  validation,
  isValid,
  onValidate,
  isFieldRequired,
  getErrorText,
  modelExpose,
  yesNoOptions,
} = useVFormPartialPlanInformation(
  modelDataComputed,
  schemaBackendComputed,
  showDocumentComputed,
);

defineExpose({
  model: modelExpose, validation, isValid, onValidate,
});
</script>

<template>
  <div class="VFormPartialPlanInformation v-form-partial-plan-information">
    <div class="v-form-partial-plan-information__subtitle is--h3__title">
      Plan Information
    </div>
    <FormRow>
      <FormCol>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired('name')"
          :error-text="getErrorText('name', errorDataComputed as any)"
          label="Name of the Solo 401(k)"
          data-testid="name-group"
        >
          <VFormInput
            :model-value="model.name"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="Name of the Solo 401(k)"
            name="name"
            size="large"
            data-testid="name"
            :loading="loadingComputed"
            @update:model-value="model.name = $event"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
    <FormRow>
      <FormCol>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired('is_use_ein')"
          :error-text="getErrorText('is_use_ein', errorDataComputed as any)"
          data-testid="is-use-ein-group"
          label="Does this Solo 401K use an EIN for tax filing?"
        >
          <VFormRadio
            v-model="model.is_use_ein"
            :is-error="VFormGroupProps.isFieldError"
            :options="yesNoOptions"
            row
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
    <FormRow v-if="model.is_use_ein === 'Yes'">
      <FormCol>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired('ein')"
          :error-text="getErrorText('ein', errorDataComputed as any)"
          label="EIN"
          data-testid="ein-group"
        >
          <VFormInput
            :model-value="model.ein"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="XX-XXXXXXX"
            name="ein"
            size="large"
            mask="##-#######"
            disallow-special-chars
            data-testid="ein"
            :loading="loadingComputed"
            @update:model-value="model.ein = $event"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
    <FormRow v-if="showDocumentComputed">
      <FormCol>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired('plan_document_id')"
          :error-text="getErrorText('plan_document_id', errorDataComputed as any)"
          label="Plan Document"
          data-testid="ein-group"
        >
          <VUploaderWithIds
            :is-error="VFormGroupProps.isFieldError"
            :is-loading="loadingComputed"
            :multiple="false"
            :max-files="1"
            accepted-file-types="application/pdf"
            supported-files-text="PDF"
            max-size-text="10MB"
            @upload-success="model.plan_document_id = $event[0]"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
  </div>
</template>

<style lang="scss">
.v-form-partial-plan-information {
  display: flex;
  flex-direction: column;
  width: 100%;

  &__subtitle {
    margin-bottom: 20px;
    margin-top: 12px;
  }
}
</style>
