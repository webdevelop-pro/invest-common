<script setup lang="ts">
import { PropType } from 'vue';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormPartialBeneficialOwnershipItem from './VFormPartialBeneficialOwnershipItem.vue';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { useVFormPartialBeneficialOwnership, FormModelBeneficialOwnership } from './logic/useVFormPartialBeneficialOwnership';



const props = defineProps({
  modelData: {
    type: Object as PropType<FormModelBeneficialOwnership>,
    required: true,
  },
  errorData: Object,
  schemaBackend: Object as PropType<JSONSchemaType<FormModelBeneficialOwnership> | undefined>,
  loading: Boolean,
  trust: Boolean,
});

const {
  model,
  validation,
  isValid,
  onValidate,
  options,
  optionsCountry,
  optionsState,
  modelExpose,
  getSchema,
  title,
  selectText,
  errorData,
  loading,
  trust,
  schemaBackend,
} = useVFormPartialBeneficialOwnership(
  props.modelData,
  props.errorData,
  props.schemaBackend,
  props.loading,
  props.trust,
);

defineExpose({
  model: modelExpose, validation, isValid, onValidate,
});
</script>

<template>
  <div class="VFormPartialBeneficialOwnership v-form-partial-beneficial-ownership">
    <div class="v-form-partial-beneficial-ownership__subtitle is--h3__title">
      {{ title }}
    </div>
    <FormRow>
      <FormCol>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="getSchema()"
          :error-text="errorData?.beneficial_owners_number"
          path="beneficial_owners_number"
          :label="selectText"
          data-testid="beneficial-owners-number-group"
        >
          <VFormSelect
            v-model="model.beneficial_owners_number"
            :is-error="VFormGroupProps.isFieldError"
            name="beneficial_owners_number"
            size="large"
            placeholder="Select"
            item-label="name"
            item-value="value"
            :options="options"
            dropdown-absolute
            data-testid="beneficial-owners-number"
            :loading="loading || (options.length === 0)"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
    <template
      v-for="(item, index) in Number(model.beneficial_owners_number || 0)"
      :key="index"
    >
      <VFormPartialBeneficialOwnershipItem
        :ref="`itemChild${index}`"
        v-model="model.beneficials[index]"
        :item-index="index"
        :validation="validation"
        :schema="getSchema(model.beneficials[index]?.non_us)"
        :options-country="optionsCountry"
        :options-state="optionsState"
        :trust="trust"
        :loading="loading"
        :schema-backend="schemaBackend || {}"
        :error-data="errorData"
      />
    </template>
  </div>
</template>

<style lang="scss">
.v-form-partial-beneficial-ownership {
  display: flex;
  flex-direction: column;
  width: 100%;

  &__subtitle {
    margin-bottom: 20px;
    margin-top: 12px;
  }
}
</style>
