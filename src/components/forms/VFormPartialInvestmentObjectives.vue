<script setup lang="ts">
import {
  watch, PropType, computed,
} from 'vue';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
import { storeToRefs } from 'pinia';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { errorMessageRule } from 'UiKit/helpers/validation/rules';
import { FormModelInvestmentObjectives } from 'InvestCommon/types/form';
import { numberFormatter } from 'InvestCommon/helpers/numberFormatter';
import { filterSchema } from 'UiKit/helpers/validation/general';
import { getOptions, createFormModel } from 'UiKit/helpers/model';
import { useFormValidation } from 'InvestCommon/composable/useFormValidation';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';

const props = defineProps({
  modelData: Object as PropType<FormModelInvestmentObjectives>,
  // errorData: Object,
  // schemaBackend: Object,
  loading: Boolean,
});

const useRepositoryProfilesStore = useRepositoryProfiles();
const { setProfileByIdState, getProfileByIdOptionsState } = storeToRefs(useRepositoryProfilesStore);

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

const schemaBackend = computed(() => getProfileByIdOptionsState.value.data);
const errorData = computed(() => setProfileByIdState.value.error);
const schemaBackendLocal = computed(() => filterSchema(schemaBackend.value, createFormModel(schemaFrontend)));

const {
  model, validation, isValid, onValidate, schemaObject,
} = useFormValidation<FormModelInvestmentObjectives>(
  schemaFrontend,
  schemaBackendLocal,
  {
    investment_objectives: {
      ...props.modelData?.investment_objectives,
    },
  } as FormModelInvestmentObjectives,
);

const optionsDuration = computed(() => getOptions('investment_objectives.duration', schemaObject));
const optionsAccess = computed(() => getOptions('investment_objectives.importance_of_access', schemaObject));
const optionsObjectives = computed(() => getOptions('investment_objectives.objectives', schemaObject));
const optionsRiskComfort = computed(() => getOptions('investment_objectives.risk_comfort', schemaObject));

defineExpose({
  model, validation, isValid, onValidate,
});

watch(() => props.modelData?.investment_objectives, () => {
  if (props.modelData?.investment_objectives?.duration) {
    model.investment_objectives.duration = props.modelData?.investment_objectives.duration;
  }
  if (props.modelData?.investment_objectives?.importance_of_access) {
    model.investment_objectives.importance_of_access = props.modelData?.investment_objectives.importance_of_access;
  }
  if (props.modelData?.investment_objectives?.objectives) {
    model.investment_objectives.objectives = props.modelData?.investment_objectives.objectives;
  }
  if (props.modelData?.investment_objectives?.risk_comfort) {
    model.investment_objectives.risk_comfort = props.modelData?.investment_objectives.risk_comfort;
  }
  if (props.modelData?.investment_objectives?.years_experience) {
    model.investment_objectives.years_experience = props.modelData?.investment_objectives.years_experience;
  }
}, { deep: true, immediate: true });
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
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="schemaFrontend"
          :error-text="errorData?.investment_objectives.objectives"
          path="investment_objectives.objectives"
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
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="schemaFrontend"
          :error-text="errorData?.investment_objectives.years_experience"
          path="investment_objectives.years_experience"
          label="Investment Years Experience"
        >
          <VFormInput
            :model-value="model.investment_objectives.years_experience ? String(model.investment_objectives.years_experience) : undefined"
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
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="schemaFrontend"
          :error-text="errorData?.investment_objectives.duration"
          path="investment_objectives.duration"
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
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="schemaFrontend"
          :error-text="errorData?.investment_objectives.importance_of_access"
          path="investment_objectives.importance_of_access"
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
          :model="model"
          :validation="validation"
          :schema-back="schemaBackend"
          :schema-front="schemaFrontend"
          :error-text="errorData?.investment_objectives.risk_comfort"
          path="investment_objectives.risk_comfort"
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
