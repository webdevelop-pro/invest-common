<script setup lang="ts">
import {
  PropType, computed,
} from 'vue';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormRadio from 'UiKit/components/Base/VForm/VFormRadio.vue';
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VUploaderWithIds from 'InvestCommon/features/filer/VUploaderWithIds.vue';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { useVFormPartialEntityInformation, FormModelEntityInformation } from './logic/useVFormPartialEntityInformation';

const props = defineProps({
  modelData: Object as PropType<FormModelEntityInformation>,
  errorData: Object,
  schemaBackend: Object as PropType<JSONSchemaType<FormModelEntityInformation> | undefined>,
  loading: Boolean,
  isEditMode: Boolean,
});

const modelDataComputed = computed(() => props.modelData);
const errorDataComputed = computed(() => props.errorData);
const schemaBackendComputed = computed(() => props.schemaBackend);
const loadingComputed = computed(() => props.loading);
const isEditModeComputed = computed(() => props.isEditMode);

const {
  model,
  validation,
  isValid,
  onValidate,
  isFieldRequired,
  getErrorText,
  yesNoOptions,
  optionsType,
  operatingAgreementLabel,
} = useVFormPartialEntityInformation(
  modelDataComputed,
  schemaBackendComputed,
  errorDataComputed,
  loadingComputed,
  isEditModeComputed,
);

defineExpose({
  model, validation, isValid, onValidate,
});

</script>

<template>
  <div class="VFormPartialEntityInformation v-form-partial-entity-information">
    <div class="v-form-partial-entity-information__subtitle is--h3__title">
      Entity Information
    </div>
    <FormRow>
      <FormCol col3>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired('type')"
          :error-text="getErrorText('type', errorDataComputed as any)"
          label="Type of Entity"
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
            :readonly="isEditMode"
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
          label="Name of Entity"
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
          label="Your Title within Entity"
          data-testid="owner-title-group"
        >
          <VFormInput
            :model-value="model.owner_title"
            :is-error="VFormGroupProps.isFieldError"
            placeholder="Owner Title"
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
      <FormCol col3>
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
    <FormRow>
      <FormCol>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired('solely_for_investing')"
          :error-text="getErrorText('solely_for_investing', errorDataComputed as any)"
          data-testid="solely-for-investing"
          label="Was this Entity created solely for investing on our platform?"
        >
          <VFormRadio
            v-model="model.solely_for_investing"
            :is-error="VFormGroupProps.isFieldError"
            :options="yesNoOptions"
            row
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
    <FormRow>
      <FormCol>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired('tax_exempts')"
          :error-text="getErrorText('tax_exempts', errorDataComputed as any)"
          data-testid="tax-exempts"
          label="Does your entity have Tax Exempt Status?"
        >
          <VFormRadio
            v-model="model.tax_exempts"
            :is-error="VFormGroupProps.isFieldError"
            :options="yesNoOptions"
            row
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
    <FormRow v-if="!isEditModeComputed">
      <FormCol col3>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired('operating_agreement_id')"
          :error-text="getErrorText('operating_agreement_id', errorDataComputed as any)"
          :label="operatingAgreementLabel"
          data-testid="operating-agreement-document-group"
        >
          <VUploaderWithIds
            :is-error="VFormGroupProps.isFieldError"
            :is-loading="loadingComputed"
            :multiple="false"
            :max-files="1"
            accepted-file-types="application/pdf"
            supported-files-text="PDF"
            max-size-text="10MB"
            @upload-success="model.operating_agreement_id = $event[0]"
          />
        </VFormGroup>
      </FormCol>
      <FormCol col3>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired('organization_document_id')"
          :error-text="getErrorText('organization_document_id', errorDataComputed as any)"
          label="Organization Document"
          data-testid="organization-document-group"
        >
          <VUploaderWithIds
            :is-error="VFormGroupProps.isFieldError"
            :is-loading="loadingComputed"
            :multiple="false"
            :max-files="1"
            accepted-file-types="application/pdf"
            supported-files-text="PDF"
            max-size-text="10MB"
            @upload-success="model.organization_document_id = $event[0]"
          />
        </VFormGroup>
      </FormCol>
      <FormCol col3>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired('formation_document_id')"
          :error-text="getErrorText('formation_document_id', errorDataComputed as any)"
          label="Formation Document"
          data-testid="entity-document-group"
        >
          <VUploaderWithIds
            :is-error="VFormGroupProps.isFieldError"
            :is-loading="loadingComputed"
            :multiple="false"
            :max-files="1"
            accepted-file-types="application/pdf"
            supported-files-text="PDF"
            max-size-text="10MB"
            @upload-success="model.formation_document_id = $event[0]"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
  </div>
</template>

<style lang="scss">
.v-form-partial-entity-information {
  display: flex;
  flex-direction: column;
  width: 100%;

  &__subtitle {
    margin-bottom: 20px;
    margin-top: 12px;
  }
}
</style>
