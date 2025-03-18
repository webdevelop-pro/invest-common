<script setup lang="ts">
import {
  watch, PropType, computed, reactive,
  ref,
} from 'vue';
import { useUserProfilesStore } from 'InvestCommon/store/useUserProfiles';
import FormRow from 'UiKit/components/Base/VForm/VFormRow.vue';
import FormCol from 'UiKit/components/Base/VForm/VFormCol.vue';
import VFormSelect from 'UiKit/components/Base/VForm/VFormSelect.vue';
import { storeToRefs } from 'pinia';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import {
  address1Rule, cityRule, countryRuleObject, dobRule,
  emailRule, errorMessageRule, firstNameRule, lastNameRule,
  phoneRule, ssnRule, stateRule, zipRule,
} from 'UiKit/helpers/validation/rules';
import { filterSchema, getFieldSchema } from 'UiKit/helpers/validation/general';
import { createFormModel, getOptions } from 'UiKit/helpers/model';
import { PrecompiledValidator } from 'UiKit/helpers/validation/PrecompiledValidator';
import { isEmpty } from 'UiKit/helpers/general';
import VFormPartialBeneficialOwnershipItem, { FormPartialBeneficialOwnershipItem } from './VFormPartialBeneficialOwnershipItem.vue';

interface FormModelBeneficialOwnership {
  beneficial_owners_number: number;
  beneficials: FormPartialBeneficialOwnershipItem[];
}
const options = [
  { value: '0', name: '0' },
  { value: '1', name: '1' },
  { value: '2', name: '2' },
  { value: '3', name: '3' },
  { value: '4', name: '4' },
];

const requiredDefault = ['address1', 'first_name', 'last_name', 'dob', 'email', 'phone', 'city', 'state', 'zip_code', 'country'];

const props = defineProps({
  modelData: Object as PropType<FormModelBeneficialOwnership>,
  trust: Boolean,
});

const defItem = {
  non_us: false,
};

const userProfilesStore = useUserProfilesStore();
const {
  setProfileByIdErrorData, getProfileByIdOptionsData, isGetProfileByIdLoading,
} = storeToRefs(userProfilesStore);

const getSchema = (non_us = false) => {
  // const requireBusinessController = [...requiredDefault];
  const requireIdentification = [];
  // if (!non_us) requireBusinessController.push('ssn');
  // if (non_us) {
  //   requireIdentification.push('id_number');
  //   requireIdentification.push('country');
  // }
  return ({
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
      BusinessController: {
        properties: {
          first_name: firstNameRule,
          last_name: lastNameRule,
          address1: address1Rule,
          dob: dobRule,
          city: cityRule,
          state: stateRule,
          zip_code: zipRule,
          country: countryRuleObject,
          phone: phoneRule,
          email: emailRule,
          non_us: { type: 'boolean' },
          ssn: ssnRule,
        },
        required: requiredDefault,
        if: { properties: { non_us: { const: false } } },
        then: { required: ['ssn'] },
      },
      Identification: {
        allOf: [
          {
            if: { properties: { non_us: { const: true } } },
            then: { required: ['id_number', 'country'] },
          },
        ],
        // required: ['id_number', 'country'],
      },
      Entity: {
        properties: {
          beneficials: {
            items: {
              type: 'object',
              $ref: '#/definitions/BusinessController',
            },
          },
          beneficial_owners_number: {},
        },
        type: 'object',
        errorMessage: errorMessageRule,
        required: ['beneficial_owners_number'],
      },
      Trust: {
        properties: {
          beneficials: {
            items: {
              type: 'object',
              $ref: '#/definitions/BusinessController',
            },
          },
          beneficial_owners_number: {},
        },
        type: 'object',
        errorMessage: errorMessageRule,
        required: ['beneficial_owners_number'],
      },
    },
    $ref: props.trust ? '#/definitions/Trust' : '#/definitions/Entity',
  } as unknown as JSONSchemaType<FormModelBeneficialOwnership>);
};

const model = reactive<FormModelBeneficialOwnership>({
  beneficials: [],
});
const formModel = createFormModel(getSchema());
let validator = new PrecompiledValidator<FormModelBeneficialOwnership>(
  filterSchema(getProfileByIdOptionsData.value, formModel),
  getSchema(),
);
const validation = ref<unknown>();
const isValid = computed(() => isEmpty(validation.value || {}));

const onValidate = () => {
  validation.value = validator.getFormValidationErrors(model);
  console.log(validation.value);
};

const schemaObject = computed(() => getFieldSchema(
  'beneficials.items',
  getProfileByIdOptionsData.value.$ref,
  getProfileByIdOptionsData.value,
));
const optionsCountry = computed(() => getOptions('properties.country', schemaObject));
const optionsState = computed(() => getOptions('properties.state', schemaObject));

const modelExpose = computed(() => {
  const temp = { ...model };
  delete temp.beneficial_owners_number;
  return temp;
});

defineExpose({
  model: modelExpose, validation, validator, isValid, onValidate,
});

// watch(() => props.modelData?.business_controller, () => {
//   if (props.modelData?.business_controller) model.business_controller = props.modelData?.business_controller;
// }, { deep: true, immediate: true });

watch(() => model, () => {
  if (!isValid.value) onValidate();
}, { deep: true });

watch(() => [getProfileByIdOptionsData.value], () => {
  validator = new PrecompiledValidator<FormModelBeneficialOwnership>(
    filterSchema(getProfileByIdOptionsData.value, formModel),
    getSchema(),
  );
});
watch(() => model.beneficial_owners_number, () => {
  const items = [];
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < model.beneficial_owners_number; i++) {
    items.push({ ...defItem });
  }
  model.beneficials = [...items];
});

const title = props.trust ? 'Trustees/Protectors Information' : 'Beneficial Ownership Information';
const selectText = props.trust ? 'How many trustees and protectors does your trust have?' : 'How many Beneficial Owners who own 25% or more of this Legal Entity?';
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
          :schema-back="getProfileByIdOptionsData"
          :schema-front="getSchema()"
          :error-text="setProfileByIdErrorData?.beneficial_owners_number"
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
            :loading="isGetProfileByIdLoading || (options.length === 0)"
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
