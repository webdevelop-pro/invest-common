<script setup lang="ts">
import {
  watch, PropType, computed, toRaw,
} from 'vue';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { errorMessageRule } from 'UiKit/helpers/validation/rules';
import { FormModelInvestmentObjectives } from 'InvestCommon/types/form';
import { numberFormatter } from 'InvestCommon/helpers/numberFormatter';
import { useFormValidation } from 'UiKit/helpers/validation/useFormValidation';

const props = defineProps({
  modelData: Object as PropType<FormModelInvestmentObjectives>,
  errorData: Object,
  schemaBackend: Object,
  loading: Boolean,
});

const schemaFrontend = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    InvestmentObjectives: {
      properties: {
        duration: {},
        importance_of_access: {},
        objectives: {},
        risk_comfort: {},
        years_experience: {},
      },
      type: 'object',
      additionalProperties: false,
      required: ['duration', 'importance_of_access', 'objectives', 'risk_comfort', 'years_experience'],
    },
    Individual: {
      properties: {
        investment_objectives: { type: 'object', $ref: '#/definitions/InvestmentObjectives' },
      },
      type: 'object',
      errorMessage: errorMessageRule,
    },
  },
  $ref: '#/definitions/Individual',
} as unknown as JSONSchemaType<FormModelInvestmentObjectives>;

const schemaBackendLocal = computed(() => (props.schemaBackend ? structuredClone(toRaw(props.schemaBackend)) : null));

const fieldsPaths = [
  'investment_objectives.duration',
  'investment_objectives.importance_of_access',
  'investment_objectives.objectives',
  'investment_objectives.risk_comfort',
  'investment_objectives.years_experience',
];

const {
  model,
  validation,
  isValid,
  onValidate,
  isFieldRequired,
  getErrorText,
  getOptions,
} = useFormValidation<FormModelInvestmentObjectives>(
  schemaFrontend,
  schemaBackendLocal,
  {
    investment_objectives: {
      ...props.modelData?.investment_objectives,
    },
  } as FormModelInvestmentObjectives,
  fieldsPaths,
);

const optionsDuration = computed(() => getOptions('investment_objectives.duration'));
const optionsAccess = computed(() => getOptions('investment_objectives.importance_of_access'));
const optionsObjectives = computed(() => getOptions('investment_objectives.objectives'));
const optionsRiskComfort = computed(() => getOptions('investment_objectives.risk_comfort'));

defineExpose({
  model, validation, isValid, onValidate,
});

watch(() => props.modelData, (newModelData) => {
  if (!newModelData || !newModelData.investment_objectives) return;
  const fields = [
    'duration', 'importance_of_access', 'objectives', 'risk_comfort', 'years_experience',
  ] as const;
  fields.forEach((field) => {
    if (newModelData.investment_objectives[field] !== undefined && newModelData.investment_objectives[field] !== null) {
      model.investment_objectives[field] = newModelData.investment_objectives[field];
    }
  });
}, { deep: true, immediate: true });

const yearsExporience = computed(() => (
  model.investment_objectives.years_experience ? String(model.investment_objectives.years_experience) : undefined
));
</script>

<template>
  <div class="VFormPartialInvestmentObjectives v-form-partial-investment-objectives">
    <div class="v-form-partial-investment-objectives__subtitle is--h3__title ">
      Investment Objectives
    </div>
    <FormRow>
      <FormCol>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired('investment_objectives.objectives')"
          :error-text="getErrorText('investment_objectives.objectives', errorData as any)"
          label="Investment objectives"
        >
          <VFormSelect
            v-model="model.investment_objectives.objectives"
            :is-error="VFormGroupProps.isFieldError"
            item-label="name"
            item-value="value"
            name="investment-objectives"
            placeholder="Investment objectives"
            size="large"
            data-testid="investment-objectives"
            :options="optionsObjectives"
            :loading="loading || (optionsObjectives.length === 0)"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
    <FormRow>
      <FormCol col2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired('investment_objectives.years_experience')"
          :error-text="getErrorText('investment_objectives.years_experience', errorData as any)"
          label="Investment Years Experience"
        >
          <VFormInput
            :model-value="yearsExporience"
            :is-error="VFormGroupProps.isFieldError"
            size="large"
            placeholder="10"
            name="years-experience"
            data-testid="years-experience"
            :loading="loading"
            @update:model-value="model.investment_objectives.years_experience = numberFormatter($event)"
          />
        </VFormGroup>
      </FormCol>

      <FormCol col2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired('investment_objectives.duration')"
          :error-text="getErrorText('investment_objectives.duration', errorData as any)"
          label="How long do you plan to invest"
        >
          <VFormSelect
            v-model="model.investment_objectives.duration"
            :is-error="VFormGroupProps.isFieldError"
            item-label="name"
            item-value="value"
            name="duration"
            placeholder="How long do you plan to invest"
            data-testid="duration"
            size="large"
            :options="optionsDuration"
            :loading="loading || (optionsDuration.length === 0)"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
    <FormRow>
      <FormCol>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired('investment_objectives.importance_of_access')"
          :error-text="getErrorText('investment_objectives.importance_of_access', errorData as any)"
          label="How important is it to have immediate access to your invested funds"
        >
          <VFormSelect
            v-model="model.investment_objectives.importance_of_access"
            :is-error="VFormGroupProps.isFieldError"
            item-label="name"
            item-value="value"
            name="importance-of-access"
            data-testid="importance-of-access"
            placeholder="How important is it to have immediate access to your invested funds"
            size="large"
            :options="optionsAccess"
            :loading="loading || (optionsAccess.length === 0)"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
    <FormRow>
      <FormCol>
        <VFormGroup
          v-slot="VFormGroupProps"
          :required="isFieldRequired('investment_objectives.risk_comfort')"
          :error-text="getErrorText('investment_objectives.risk_comfort', errorData as any)"
          label="How much risk are you comfortable with"
        >
          <VFormSelect
            v-model="model.investment_objectives.risk_comfort"
            :is-error="VFormGroupProps.isFieldError"
            item-label="name"
            item-value="value"
            name="risk-comfort"
            data-testid="risk-comfort"
            placeholder="How much risk are you comfortable with"
            size="large"
            :options="optionsRiskComfort"
            :loading="loading || (optionsRiskComfort.length === 0)"
          />
        </VFormGroup>
      </FormCol>
    </FormRow>
  </div>
</template>

<style lang="scss">
.v-form-partial-investment-objectives {
  display: flex;
  flex-direction: column;
  width: 100%;

  &__subtitle {
    margin-bottom: 20px;
    margin-top: 12px;
  }
}
</style>
