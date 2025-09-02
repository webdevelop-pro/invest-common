<script setup lang="ts">
import { PropType, computed } from 'vue';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormRadio from 'UiKit/components/Base/VForm/VFormRadio.vue';
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VUploaderWithIds from 'InvestCommon/features/filer/VUploaderWithIds.vue';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { useVFormPartialTrustInformation, FormModelTrustInformation } from './logic/useVFormPartialTrustInformation';

const props = defineProps({
  modelData: Object as PropType<FormModelTrustInformation>,
  errorData: Object,
  schemaBackend: Object as PropType<JSONSchemaType<FormModelTrustInformation> | undefined>,
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
  optionsType,
  yesNoOptions,
} = useVFormPartialTrustInformation(
  modelDataComputed,
  schemaBackendComputed,
  showDocumentComputed,
);

defineExpose({
  model: modelExpose, validation, isValid, onValidate,
});
</script>

<template>
  <div class="VFormPartialTrustInformation v-form-partial-trust-information">
    <div class="v-form-partial-trust-information__subtitle is--h3__title">
      Trust Information
    </div>
    <FormRow>
      <FormCol col3>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired('type')"
          :error-text="getErrorText('type', errorDataComputed as any)"
          label="Type of Trust"
          data-testid="type-group"
        >
          <VFormSelect
            v-model="model.type"
            :is-error="VFormGroupProps.isFieldError"
            name="type"
            size="large"
            placeholder="Type"
            item-label="name"
            item-value="value"
            searchable
            :options="optionsType"
            :loading="loadingComputed || (optionsType?.length === 0)"
            data-testid="type"
          />
        </VFormGroup>
      </FormCol>
      <FormCol col3>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired('name')"
          :error-text="getErrorText('name', errorDataComputed as any)"
          label="Name of Trust"
          data-testid="name-group"
        >
          <VFormInput
            :model-value="model.name"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="Name"
            name="name"
            size="large"
            data-testid="name"
            :loading="loadingComputed"
            @update:model-value="model.name = $event"
          />
        </VFormGroup>
      </FormCol>
      <FormCol col3>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired('owner_title')"
          :error-text="getErrorText('owner_title', errorDataComputed as any)"
          label="Your Title within Trust"
          data-testid="owner-title-group"
        >
          <VFormInput
            :model-value="model.owner_title"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="Title"
            name="owner_title"
            size="large"
            data-testid="owner-title"
            :loading="loadingComputed"
            @update:model-value="model.owner_title = $event"
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
          label="Does this Trust have an EIN"
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
          :required="isFieldRequired('trust_agreement_id')"
          :error-text="getErrorText('trust_agreement_id', errorDataComputed as any)"
          label="Trust Agreement"
          data-testid="trust-document-group"
        >
          <VUploaderWithIds
            :is-error="VFormGroupProps.isFieldError"
            :is-loading="loadingComputed"
            :multiple="false"
            :max-files="1"
            accepted-file-types="application/pdf"
            supported-files-text="PDF"
            max-size-text="10MB"
            @upload-success="model.trust_agreement_id = $event[0]"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
  </div>
</template>

<style lang="scss">
.v-form-partial-trust-information {
  display: flex;
  flex-direction: column;
  width: 100%;

  &__subtitle {
    margin-bottom: 20px;
    margin-top: 12px;
  }
}
</style>
