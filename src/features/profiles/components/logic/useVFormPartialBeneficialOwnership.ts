import {
  computed, watch, toRaw, ComputedRef,
} from 'vue';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import {
  address1Rule, cityRule, countryRuleObject, dobRule,
  emailRule, errorMessageRule, firstNameRule, lastNameRule,
  phoneRule, ssnRule, stateRule, zipRule,
} from 'UiKit/helpers/validation/rules';
import { useFormValidation } from 'InvestCommon/composable/useFormValidation';
import { getOptions } from 'UiKit/helpers/model';
import { getFieldSchema } from 'UiKit/helpers/validation/general';
import type { FormPartialBeneficialOwnershipItem } from '../VFormPartialBeneficialOwnershipItem.vue';

export interface FormModelBeneficialOwnership {
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
const defItem = {
  non_us: false,
};

export function useVFormPartialBeneficialOwnership(
  modelData: ComputedRef<FormModelBeneficialOwnership>,
  errorData: ComputedRef<any>,
  schemaBackend: ComputedRef<JSONSchemaType<FormModelBeneficialOwnership> | undefined>,
  loading: ComputedRef<boolean>,
  trust: ComputedRef<boolean>,
) {
  const getSchema = () => ({
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
    $ref: trust.value ? '#/definitions/Trust' : '#/definitions/Entity',
  } as unknown as JSONSchemaType<FormModelBeneficialOwnership>);

  const schemaBackendLocal = computed(() => (
    schemaBackend.value ? structuredClone(toRaw(schemaBackend.value)) : undefined));

  const {
    model,
    validation,
    isValid,
    onValidate,
  } = useFormValidation<FormModelBeneficialOwnership>(
    getSchema(),
    schemaBackendLocal,
    {
      beneficials: [],
    },
  );

  const schemaObject = computed(() => getFieldSchema(
    'beneficials.items',
    schemaBackendLocal.value?.$ref,
    schemaBackendLocal.value,
  ));
  const optionsCountry = computed(() => getOptions('properties.country', schemaObject));
  const optionsState = computed(() => getOptions('properties.state', schemaObject));

  const modelExpose = computed(() => {
    const temp = { ...model };
    delete temp.beneficial_owners_number;
    return temp;
  });

  watch(() => model.beneficial_owners_number, () => {
    const items: FormPartialBeneficialOwnershipItem[] = [];
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < model.beneficial_owners_number; i++) {
      items.push({ ...defItem });
    }
    model.beneficials = [...items];
  });

  const title = computed(() => (trust.value ? 'Trustees/Protectors Information' : 'Beneficial Ownership Information'));
  const selectText = computed(() => (trust.value ? 'How many trustees and protectors does your trust have?' : 'How many Beneficial Owners who own 25% or more of this Legal Entity?'));

  return {
    model,
    validation,
    isValid,
    onValidate,
    options,
    optionsCountry,
    optionsState,
    modelExpose,
    getSchema,
    schemaBackendLocal,
    title,
    selectText,
    errorData,
    loading,
    trust,
    schemaBackend,
  };
}
