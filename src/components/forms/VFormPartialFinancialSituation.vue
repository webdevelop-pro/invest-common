<script setup lang="ts">
import {
  watch, PropType, reactive, ref, computed,
} from 'vue';
import { useUserProfilesStore } from 'InvestCommon/store/useUserProfiles';
import FormRow from 'InvestCommon/components/VForm/VFormRow.vue';
import FormCol from 'InvestCommon/components/VForm/VFormCol.vue';
import { storeToRefs } from 'pinia';
import VFormGroup from 'UiKit/components/VForm/VFormGroup.vue';
import VFormRadio from 'UiKit/components/VForm/VFormRadio.vue';
import { JSONSchemaType } from 'ajv';
import { FormModelFinancialSituation } from 'InvestCommon/types/form';
import { urlBlogSingle } from 'InvestCommon/global/links';
import { errorMessageRule } from 'UiKit/helpers/validation/rules';
import { PrecompiledValidator } from 'UiKit/helpers/validation/PrecompiledValidator';
import { filterSchema } from 'UiKit/helpers/validation/general';
import { isEmpty } from 'UiKit/helpers/general';
import { createFormModel } from 'UiKit/helpers/model';


const isAccreditedRadioOptions = [
  {
    value: true,
    text: 'Yes',
  },
  {
    value: false,
    text: 'No',
  },
];

const props = defineProps({
  modelData: Object as PropType<FormModelFinancialSituation>,
});

const userIdentityStore = useUserProfilesStore();
const {
  setProfileByIdErrorData, getProfileByIdOptionsData,
} = storeToRefs(userIdentityStore);

const schema = {
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

const model = reactive<FormModelFinancialSituation>({
  accredited_investor: {
    is_accredited: props.modelData?.accredited_investor?.is_accredited || false,
  },
});
const formModel = createFormModel(schema);
let validator = new PrecompiledValidator<FormModelFinancialSituation>(
  filterSchema(getProfileByIdOptionsData.value, formModel),
  schema,
);
const validation = ref<unknown>();
const isValid = computed(() => isEmpty(validation.value || {}));

const onValidate = () => {
  validation.value = validator.getFormValidationErrors(model);
};


defineExpose({
  model, validation, validator, isValid, onValidate,
});


watch(() => props.modelData?.accredited_investor?.is_accredited, () => {
  if (props.modelData?.accredited_investor?.is_accredited && model.accredited_investor?.is_accredited) {
    model.accredited_investor.is_accredited = props.modelData?.accredited_investor?.is_accredited;
  }
}, { deep: true });


watch(() => model, () => {
  if (!isValid.value) onValidate();
}, { deep: true });

watch(() => [getProfileByIdOptionsData.value, schema], () => {
  validator = new PrecompiledValidator<FormModelFinancialSituation>(
    filterSchema(getProfileByIdOptionsData.value, formModel),
    schema,
  );
});
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
          :model="model"
          :validation="validation"
          :schema-back="getProfileByIdOptionsData"
          :schema-front="schema"
          :error-text="setProfileByIdErrorData?.accredited_investor?.is_accredited"
          path="accredited_investor.is_accredited"
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
            v-model="model.accredited_investor.is_accredited"
            :is-error="VFormGroupProps.isFieldError"
            :options="isAccreditedRadioOptions"
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
