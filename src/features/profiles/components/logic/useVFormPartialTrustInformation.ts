import {
  computed, reactive, toRaw, watch, ComputedRef,
} from 'vue';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { errorMessageRule, documentRule } from 'UiKit/helpers/validation/rules';
import { useFormValidation } from 'UiKit/helpers/validation/useFormValidation';

const yesNoOptions = [
  { value: 'Yes', text: 'Yes' },
  { value: 'No', text: 'No' },
];

export interface FormModelTrustInformation {
  is_use_ein: string | undefined;
  ein?: string;
  type: string | undefined;
  owner_title: string | undefined;
  name: string | undefined;
  trust_agreement_id?: number | string | undefined;
}

export const useVFormPartialTrustInformation = (
  modelData: ComputedRef<FormModelTrustInformation | undefined>,
  schemaBackend: ComputedRef<JSONSchemaType<FormModelTrustInformation> | undefined>,
  showDocument: ComputedRef<boolean>,
) => {
  let modelLocal = reactive<FormModelTrustInformation>({
    ein: modelData.value?.ein,
    is_use_ein: modelData.value?.is_use_ein || (modelData.value?.ein ? 'Yes' : 'No'),
    type: modelData.value?.type,
    owner_title: modelData.value?.owner_title,
    name: modelData.value?.name,
  });

  const required = computed(() => {
    const baseRequired = ['type', 'owner_title', 'name', 'is_use_ein'];
    if (modelLocal.is_use_ein && modelLocal.is_use_ein === 'Yes') {
      baseRequired.push('ein');
    }
    if (showDocument.value) {
      baseRequired.push('trust_agreement_id');
    }
    return baseRequired;
  });

  const schemaFrontend = computed(() => ({
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
      Trust: {
        properties: {
          type: {},
          is_use_ein: {},
          ein: {},
          name: {},
          owner_title: {},
          trust_agreement_id: documentRule,
        },
        type: 'object',
        errorMessage: errorMessageRule,
        required: required.value,
      },
    },
    $ref: '#/definitions/Trust',
  } as unknown as JSONSchemaType<FormModelTrustInformation>));

  const schemaBackendLocal = computed(() => (
    schemaBackend.value ? structuredClone(toRaw(schemaBackend.value)) : undefined));

  const fieldsPaths = [
    'type',
    'is_use_ein',
    'ein',
    'name',
    'owner_title',
    'trust_agreement_id',
  ];

  const {
    model,
    validation,
    isValid,
    onValidate,
    isFieldRequired,
    getErrorText,
    getOptions,
  } = useFormValidation<FormModelTrustInformation>(
    schemaFrontend,
    schemaBackendLocal,
    modelLocal,
    fieldsPaths,
  );

  const optionsType = computed(() => getOptions('type'));

  const modelExpose = computed(() => {
    const temp = { ...model };
    delete temp.is_use_ein;
    return temp;
  });

  watch(() => modelData.value, () => {
    if (modelData.value?.ein) {
      model.ein = modelData.value?.ein;
      model.is_use_ein = 'Yes';
    }
    if (modelData.value?.type) {
      model.type = modelData.value?.type;
    }
    if (modelData.value?.owner_title) {
      model.owner_title = modelData.value?.owner_title;
    }
    if (modelData.value?.name) {
      model.name = modelData.value?.name;
    }
  }, { deep: true });

  watch(() => model, () => {
    modelLocal = model;
  }, { deep: true, immediate: true });

  return {
    model,
    validation,
    isValid,
    onValidate,
    isFieldRequired,
    getErrorText,
    modelExpose,
    optionsType,
    yesNoOptions,
    schemaFrontend,
  };
};
