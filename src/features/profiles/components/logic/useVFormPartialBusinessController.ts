import {
  computed, ref, toRaw, watch, type ComputedRef,
} from 'vue';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import {
  address1Rule, address2Rule, cityRule, countryRuleObject,
  dobRule,
  emailRule, errorMessageRule, firstNameRule, lastNameRule,
  phoneRule, stateRule, zipRule,
} from 'UiKit/helpers/validation/rules';
import { useFormValidation } from 'UiKit/helpers/validation/useFormValidation';
import { FormModelPersonalInformation } from 'InvestCommon/types/form';

export interface FormModelBusinessController {
  business_controller: {
    first_name: string;
    last_name: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    phone: string;
    email: string;
    dob: string;
  };
  different_owner?: boolean;
}

export const useVFormPartialBusinessController = (
  modelData: ComputedRef<FormModelBusinessController | undefined>,
  personalData: ComputedRef<FormModelPersonalInformation | undefined>,
  schemaBackend: ComputedRef<JSONSchemaType<FormModelBusinessController> | undefined>,
  errorData: ComputedRef<any>,
  loading: ComputedRef<boolean>,
  trust: ComputedRef<boolean>,
) => {
  const schemaFrontend = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
      BusinessController: {
        properties: {
          first_name: firstNameRule,
          last_name: lastNameRule,
          address1: address1Rule,
          address2: address2Rule,
          city: cityRule,
          state: stateRule,
          zip_code: zipRule,
          country: countryRuleObject,
          phone: phoneRule,
          email: emailRule,
          dob: dobRule,
        },
        required: ['first_name', 'dob', 'last_name', 'address1', 'phone', 'city', 'state', 'zip_code', 'country', 'email'],
      },
      Entity: {
        properties: {
          business_controller: {
            type: 'object',
            $ref: '#/definitions/BusinessController',
          },
          different_owner: {},
        },
        type: 'object',
        errorMessage: errorMessageRule,
      },
    },
    $ref: '#/definitions/Entity',
  } as unknown as JSONSchemaType<FormModelBusinessController>;

  const schemaBackendLocal = computed(() => (
    schemaBackend.value ? structuredClone(toRaw(schemaBackend.value)) : undefined));

  const fieldsPaths = [
    'business_controller.first_name',
    'business_controller.last_name',
    'business_controller.address1',
    'business_controller.address2',
    'business_controller.city',
    'business_controller.state',
    'business_controller.zip_code',
    'business_controller.country',
    'business_controller.phone',
    'business_controller.email',
    'business_controller.dob',
    'different_owner',
  ];

  const {
    model,
    validation,
    isValid,
    onValidate,
    isFieldRequired,
    getErrorText,
    getOptions,
  } = useFormValidation<FormModelBusinessController>(
    schemaFrontend,
    schemaBackendLocal,
    {
      business_controller: {
        first_name: '',
        last_name: '',
        address1: '',
        city: '',
        state: '',
        zip_code: '',
        country: '',
        phone: '',
        email: '',
        dob: '',
      },
      different_owner: false,
    },
    fieldsPaths,
  );

  const sameData = ref(true);
  const optionsCountry = computed(() => getOptions('business_controller.country'));
  const optionsState = computed(() => getOptions('business_controller.state'));

  watch(modelData, (newModelData) => {
    if (!newModelData?.business_controller) return;
    const fields = [
      'first_name', 'last_name', 'address1', 'address2', 'city', 'state',
      'zip_code', 'country', 'phone', 'email', 'dob',
    ] as const;
    fields.forEach((field) => {
      if (newModelData.business_controller[field] !== undefined && newModelData.business_controller[field] !== null) {
        model.business_controller[field] = newModelData.business_controller[field];
      }
    });
  }, { deep: true, immediate: true });

  watch([personalData, sameData], () => {
    model.different_owner = !sameData.value;
    if (!sameData.value) {
      model.business_controller = {} as any;
    }
    if (personalData.value && sameData.value) {
      model.business_controller.first_name = personalData.value.first_name;
      model.business_controller.last_name = personalData.value.last_name;
      model.business_controller.address1 = personalData.value.address1;
      if (personalData.value.address2) model.business_controller.address2 = personalData.value.address2;
      model.business_controller.city = personalData.value.city;
      model.business_controller.state = personalData.value.state;
      model.business_controller.zip_code = personalData.value.zip_code;
      model.business_controller.country = personalData.value.country;
      model.business_controller.phone = personalData.value.phone;
      model.business_controller.dob = personalData.value.dob;
      model.business_controller.email = personalData.value.email;
    }
  }, { deep: true, immediate: true });

  const title = computed(() => (trust.value ? 'Grantor Information' : 'Business Controller Contact Information'));
  const checkboxText = computed(() => (trust.value ? 'The Grantor and the Trustee are the same person.' : 'Business Controller contact information is the same as my personal address/phone number.'));

  return {
    model,
    validation,
    isValid,
    onValidate,
    isFieldRequired,
    getErrorText,
    optionsCountry,
    optionsState,
    sameData,
    title,
    checkboxText,
    schemaFrontend,
  };
};
