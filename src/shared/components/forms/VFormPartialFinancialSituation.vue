<script setup lang="ts">
import { PropType, watch, computed, toRaw } from 'vue';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import VFormRadio from 'UiKit/components/Base/VForm/VFormRadio.vue';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { FormModelFinancialSituation } from 'InvestCommon/types/form';
import { urlBlogSingle } from 'InvestCommon/domain/config/links';
import { errorMessageRule } from 'UiKit/helpers/validation/rules';
import { useFormValidation } from 'UiKit/helpers/validation/useFormValidation';

const isAccreditedRadioOptions = [
  {
    value: 'true',
    text: 'Yes',
  },
  {
    value: 'false',
    text: 'No',
  },
];

const props = defineProps({
  modelData: Object as PropType<FormModelFinancialSituation>,
  errorData: Object,
  schemaBackend: Object as PropType<JSONSchemaType<FormModelFinancialSituation> | undefined>,
  loading: Boolean,
});

const schemaFrontend = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    AccreditedInvestor: {
      properties: {
        is_accredited: {},
      },
      type: 'object',
    },
    Individual: {
      properties: {
        accredited_investor: { type: 'object', $ref: '#/definitions/AccreditedInvestor' },
      },
      type: 'object',
      errorMessage: errorMessageRule,
    },
  },
  $ref: '#/definitions/Individual',
} as unknown as JSONSchemaType<FormModelFinancialSituation>;

const schemaBackendLocal = computed(() => (
  props.schemaBackend ? structuredClone(toRaw(props.schemaBackend)) : undefined));
const fieldsPaths = ['accredited_investor.is_accredited'];
const {
  model,
  validation,
  isValid,
  onValidate,
  isFieldRequired,
  getErrorText,
} = useFormValidation<FormModelFinancialSituation>(
  schemaFrontend,
  schemaBackendLocal,
  {
    accredited_investor: {
      is_accredited: props.modelData?.accredited_investor?.is_accredited ?? false,
    },
  },
  fieldsPaths,
);

defineExpose({
  model, validation, isValid, onValidate,
});

watch(() => props.modelData, (newModelData) => {
  if (!newModelData) return;
  if (
    newModelData.accredited_investor?.is_accredited !== undefined
    && newModelData.accredited_investor?.is_accredited !== null
  ) {
    model.accredited_investor.is_accredited = newModelData.accredited_investor.is_accredited;
  }
}, { deep: true, immediate: true });
</script>

<template>
  <div class="VFormPartialFinancialSituation v-form-partial-financial-situation">
    <div class="v-form-partial-financial-situation__subtitle is--h3__title">
      Financial Situation
    </div>
    <FormRow>
      <FormCol>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired('accredited_investor.is_accredited')"
          :error-text="getErrorText('accredited_investor.is_accredited', errorData as any)"
          data-testid="is-accredited"
        >
          <div>
            Are you an
            <a
              :href="urlBlogSingle('accredited-investor')"
              target="_blank"
              rel="noopener noreferrer"
              class="is--link-regular"
            >
              Accredited Investor?
            </a>
          </div>
          <VFormRadio
            :model-value="model.accredited_investor.is_accredited"
            :is-error="VFormGroupProps.isFieldError"
            :options="isAccreditedRadioOptions"
            @update:model-value="model.accredited_investor.is_accredited = ($event === 'true')"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
  </div>
</template>

<style lang="scss">
.v-form-partial-financial-situation {
  display: flex;
  flex-direction: column;
  width: 100%;

  &__subtitle {
    margin-bottom: 20px;
    margin-top: 12px;
  }
}
</style>
