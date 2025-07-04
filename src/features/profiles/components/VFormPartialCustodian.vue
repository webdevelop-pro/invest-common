<script setup lang="ts">
import { PropType } from 'vue';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { useVFormPartialCustodian, FormModelSdira } from './logic/useVFormPartialCustodian';

const props = defineProps({
  modelData: Object as PropType<FormModelSdira>,
  errorData: Object,
  schemaBackend: Object,
  loading: Boolean,
});

const {
  model,
  validation,
  isValid,
  onValidate,
  optionsCustodian,
  schemaFrontend,
} = useVFormPartialCustodian(
  props.modelData,
);

defineExpose({
  model, validation, isValid, onValidate,
});
</script>

<template>
  <div class="VFormPartialCustodian v-form-partial-custodian">
    <div class="v-form-partial-custodian__subtitle is--h3__title">
      Custodian Information
    </div>
    <FormRow>
      <FormCol col2>
        <VFormGroup
          v-slot="{ isFieldError }"
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="schemaFrontend"
          :error-text="errorData?.type"
          path="type"
          label="Custodian"
          data-testid="type-group"
        >
          <VFormSelect
            v-model="model.type"
            :is-error="isFieldError"
            name="type"
            size="large"
            placeholder="Custodian"
            item-label="name"
            item-value="value"
            searchable
            :options="optionsCustodian"
            data-testid="type"
            :loading="loading || (optionsCustodian?.length === 0)"
          />
        </VFormGroup>
      </FormCol>
      <FormCol col2>
        <VFormGroup
          v-slot="{ isFieldError }"
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="schemaFrontend"
          :error-text="errorData?.account_number"
          path="account_number"
          label="Account Number"
          data-testid="account_number-group"
        >
          <VFormInput
            v-model="model.account_number"
            :is-error="isFieldError"
            placeholder="Account Number"
            name="account_number"
            size="large"
            data-testid="account_number"
            :loading="loading"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
    <FormRow>
      <FormCol>
        <VFormGroup
          v-slot="{ isFieldError }"
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="schemaFrontend"
          :error-text="errorData?.full_account_name"
          path="full_account_name"
          label="Full Account Name"
          data-testid="full-account-name-group"
        >
          <VFormInput
            v-model="model.full_account_name"
            :is-error="isFieldError"
            placeholder="Full Account Name"
            name="full_account_name"
            size="large"
            data-testid="full-account-name"
            :loading="loading"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
  </div>
</template>

<style lang="scss">
.v-form-partial-custodian {
  display: flex;
  flex-direction: column;
  width: 100%;

  &__subtitle {
    margin-bottom: 20px;
    margin-top: 12px;
  }
}
</style>
