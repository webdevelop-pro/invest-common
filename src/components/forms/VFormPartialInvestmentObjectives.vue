<script setup lang="ts">
import {
  watch, PropType, computed,
} from 'vue';
import { useUserProfilesStore } from 'InvestCommon/store/useUserProfiles';
import FormRow from 'InvestCommon/components/VForm/VFormRow.vue';
import FormCol from 'InvestCommon/components/VForm/VFormCol.vue';
import VFormInput from 'UiKit/components/VForm/VFormInput.vue';
import VFormSelect from 'UiKit/components/VForm/VFormSelect.vue';
import { storeToRefs } from 'pinia';
import VFormGroup from 'UiKit/components/VForm/VFormGroup.vue';
import { JSONSchemaType } from 'ajv';
import { errorMessageRule } from 'UiKit/helpers/validation/rules';
import { FormModelInvestmentObjectives } from 'InvestCommon/types/form';
import { numberFormatter } from 'InvestCommon/helpers/numberFormatter';
import { getFilteredObject } from 'UiKit/helpers/validation/general';
import { IInvestmentObjectives } from 'InvestCommon/types/api/user';
import { populateModel, getOptions } from 'UiKit/helpers/model';
import { useFormValidator } from 'InvestCommon/composable/useFormValidation';

const props = defineProps({
  modelData: Object as PropType<FormModelInvestmentObjectives>,
});

const userIdentityStore = useUserProfilesStore();
const {
  setProfileByIdErrorData, getProfileByIdOptionsData,
} = storeToRefs(userIdentityStore);

const schema = {
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
    PatchIndividualProfile: {
      properties: {
        investment_objectives: { type: 'object', $ref: '#/definitions/InvestmentObjectives' },
      },
      type: 'object',
      errorMessage: errorMessageRule,
    },
  },
  $ref: '#/definitions/PatchIndividualProfile',
} as unknown as JSONSchemaType<FormModelInvestmentObjectives>;

const {
  model, formModel, isValid, validator, validation, onValidate,
} = useFormValidator(
  {
    investment_objectives: {
      ...props.modelData?.investment_objectives,
      years_experience: 0,
    },
  },
  schema,
  getProfileByIdOptionsData.value,
);


const schemaObject = computed(() => getFilteredObject(getProfileByIdOptionsData.value, formModel));
const optionsDuration = computed(() => getOptions('investment_objectives.duration', schemaObject));
const optionsAccess = computed(() => getOptions('investment_objectives.importance_of_access', schemaObject));
const optionsObjectives = computed(() => getOptions('investment_objectives.objectives', schemaObject));
const optionsRiskComfort = computed(() => getOptions('investment_objectives.risk_comfort', schemaObject));

defineExpose({
  model, validation, validator, isValid, onValidate,
});

watch(() => props.modelData?.investment_objectives, () => {
  if (props.modelData?.investment_objectives) {
    model.investment_objectives = populateModel<IInvestmentObjectives>(
      props.modelData.investment_objectives,
      formModel.investment_objectives,
    );
  }
}, { deep: true });
</script>

<template>
  <div class="VFormPartialInvestmentObjectives v-form-partial-investment-objectives">
    <div class="v-form-partial-investment-objectives__subtitle is--h3__title is--margin-top">
      Investment Objectives
    </div>
    <FormRow>
      <FormCol>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="getProfileByIdOptionsData"
          :schema-front="schema"
          :error-text="setProfileByIdErrorData?.investment_objectives.objectives"
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
            dropdown-absolute
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
          :schema-back="getProfileByIdOptionsData"
          :schema-front="schema"
          :error-text="setProfileByIdErrorData?.investment_objectives.years_experience"
          path="investment_objectives.years_experience"
          label="Investment Years Experience"
        >
          <VFormInput
            :model-value="String(model.investment_objectives.years_experience)"
            :is-error="VFormGroupProps.isFieldError"
            size="large"
            placeholder="10 years"
            name="years-experience"
            data-testid="years-experience"
            @update:model-value="model.investment_objectives.years_experience = numberFormatter($event)"
          />
        </VFormGroup>
      </FormCol>

      <FormCol col2>
        <VFormGroup
          v-slot="VFormGroupProps"
          :model="model"
          :validation="validation"
          :schema-back="getProfileByIdOptionsData"
          :schema-front="schema"
          :error-text="setProfileByIdErrorData?.investment_objectives.duration"
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
            dropdown-absolute
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
          :schema-back="getProfileByIdOptionsData"
          :schema-front="schema"
          :error-text="setProfileByIdErrorData?.investment_objectives.importance_of_access"
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
            dropdown-absolute
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
          :schema-back="getProfileByIdOptionsData"
          :schema-front="schema"
          :error-text="setProfileByIdErrorData?.investment_objectives.risk_comfort"
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
            dropdown-absolute
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
