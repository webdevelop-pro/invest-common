<script setup lang="ts">
import {
  PropType, computed, watch, toRaw,
} from 'vue';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormRadio from 'UiKit/components/Base/VForm/VFormRadio.vue';
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VFormDocument from 'UiKit/components/Base/VForm/VFormDocument.vue';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { useVFormPartialEntityInformation, FormModelEntityInformation } from './logic/useVFormPartialEntityInformation';

const props = defineProps({
  modelData: Object as PropType<FormModelEntityInformation>,
  errorData: Object,
  schemaBackend: Object as PropType<JSONSchemaType<FormModelEntityInformation> | undefined>,
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
  yesNoOptions,
  schemaFrontend,
  optionsType,
  operatingAgreementLabel,
} = useVFormPartialEntityInformation(
  modelDataComputed,
  schemaBackendComputed,
  errorDataComputed,
  loadingComputed,
  showDocumentComputed,
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
          :model="model"
          :validation="validation"
          :schema-back="schemaBackendComputed"
          :schema-front="schemaFrontend"
          :error-text="errorDataComputed?.type"
          path="type"
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
            :options="optionsType"
            :loading="loadingComputed || (optionsType?.length === 0)"
            data-testid="type"
          />
        </VFormGroup>
      </FormCol>
      <FormCol col3>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="schemaBackendComputed"
          :schema-front="schemaFrontend"
          :error-text="errorDataComputed?.name"
          path="name"
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
          :model="model"
          :validation="validation"
          :schema-back="schemaBackendComputed"
          :schema-front="schemaFrontend"
          :error-text="errorDataComputed?.owner_title"
          path="owner_title"
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
      <FormCol>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="schemaBackendComputed"
          :schema-front="schemaFrontend"
          :error-text="errorDataComputed?.solely_for_investing"
          path="solely_for_investing"
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
          :model="model"
          :validation="validation"
          :schema-back="schemaBackendComputed"
          :schema-front="schemaFrontend"
          :error-text="errorDataComputed?.tax_exempts"
          path="tax_exempts"
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
    <FormRow v-if="showDocumentComputed">
      <FormCol>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="schemaBackendComputed"
          :schema-front="schemaFrontend"
          :error-text="errorDataComputed?.organization_document_id"
          path="organization_document_id"
          label="Organization Document"
          data-testid="organization-document-group"
        >
          <VFormDocument
            :is-error="VFormGroupProps.isFieldError"
            :loading="loadingComputed"
            @upload-success="model.organization_document_id = $event"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
    <FormRow v-if="showDocumentComputed">
      <FormCol>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="schemaBackendComputed"
          :schema-front="schemaFrontend"
          :error-text="errorDataComputed?.formation_document_id"
          path="formation_document_id"
          label="Formation Document"
          data-testid="entity-document-group"
        >
          <VFormDocument
            :is-error="VFormGroupProps.isFieldError"
            :loading="loadingComputed"
            @upload-success="model.formation_document_id = $event"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
    <FormRow v-if="showDocumentComputed">
      <FormCol>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="schemaBackendComputed"
          :schema-front="schemaFrontend"
          :error-text="errorDataComputed?.operating_agreement_id"
          path="operating_agreement_id"
          :label="operatingAgreementLabel"
          data-testid="operating-agreement-document-group"
        >
          <VFormDocument
            :is-error="VFormGroupProps.isFieldError"
            :loading="loadingComputed"
            @upload-success="model.operating_agreement_id = $event"
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
