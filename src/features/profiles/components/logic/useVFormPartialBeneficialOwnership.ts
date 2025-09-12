import {
  computed, watch, toRaw, ComputedRef,
} from 'vue';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import {
  address1Rule, cityRule, countryRuleObject, dobRule,
  emailRule, errorMessageRule, firstNameRule, lastNameRule,
  phoneRule, ssnRule, stateRule, zipRule,
} from 'UiKit/helpers/validation/rules';
import { useFormValidation } from 'UiKit/helpers/validation/useFormValidation';
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

  // Track top-level owner count and nested items for validity
  const fieldsPaths = ['beneficial_owners_number', 'beneficials'];

  const {
    model,
    validation,
    isValid,
    onValidate,
    isFieldRequired,
    getErrorText,
    getOptions,
  } = useFormValidation<FormModelBeneficialOwnership>(
    getSchema(),
    schemaBackendLocal,
    {
      beneficials: [],
    },
    fieldsPaths,
  );

  const optionsCountry = computed(() => getOptions('beneficials.country'));
  const optionsState = computed(() => getOptions('beneficials.state'));

  const modelExpose = computed(() => {
    const temp = { ...model };
    delete temp.beneficial_owners_number;
    return temp;
  });

  watch(() => model.beneficial_owners_number, () => {
    const items: FormPartialBeneficialOwnershipItem[] = [];
    for (let i = 0; i < model.beneficial_owners_number; i++) {
      items.push({ ...defItem });
    }
    model.beneficials = [...items];
  });

  const title = computed(() => (trust.value ? 'Trustees/Protectors Information' : 'Beneficial Ownership Information'));
  const selectText = computed(() => (trust.value ? 'How many trustees and protectors does your trust have?' : 'How many Beneficial Owners who own 25% or more of this Legal Entity?'));

  // Revalidate on any model change so field errors update live
  watch(() => model, () => {
    if (!isValid.value) {
      onValidate();
    }
  }, { deep: true });

  return {
    model,
    validation,
    isValid,
    onValidate,
    isFieldRequired,
    getErrorText,
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
