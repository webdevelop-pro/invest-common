import { computed, reactive, toRaw, watch } from 'vue';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { errorMessageRule } from 'UiKit/helpers/validation/rules';
import { useFormValidation } from 'InvestCommon/composable/useFormValidation';
import { getOptions } from 'UiKit/helpers/model';

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
  modelData: FormModelTrustInformation | undefined,
  schemaBackend: JSONSchemaType<FormModelTrustInformation> | undefined,
  showDocument: boolean,
) => {
  let modelLocal = reactive<FormModelTrustInformation>({
    ein: modelData?.ein,
    is_use_ein: modelData?.is_use_ein,
    type: modelData?.type,
    owner_title: modelData?.owner_title,
    name: modelData?.name,
  });

  const required = computed(() => {
    const baseRequired = ['type', 'owner_title', 'name', 'is_use_ein'];
    if (modelLocal.is_use_ein && modelLocal.is_use_ein === 'Yes') {
      baseRequired.push('ein');
    }
    if (showDocument) {
      baseRequired.push('trust_agreement_id');
    }
    return baseRequired;
  });

  const schemaFrontend = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
      Trust: {
        properties: {
          type: {},
          is_use_ein: {},
          ein: {},
          name: {},
          owner_title: {},
          trust_agreement_id: {},
        },
        type: 'object',
        errorMessage: errorMessageRule,
        required: required.value,
      },
    },
    $ref: '#/definitions/Trust',
  } as unknown as JSONSchemaType<FormModelTrustInformation>;

  const schemaBackendLocal = computed(() => (schemaBackend ? structuredClone(toRaw(schemaBackend)) : null));

  const {
    model,
    validation,
    isValid,
    onValidate,
    schemaObject,
  } = useFormValidation<FormModelTrustInformation>(
    schemaFrontend,
    schemaBackendLocal,
    modelLocal,
  );

  const optionsType = computed(() => getOptions('type', schemaObject));

  const modelExpose = computed(() => {
    const temp = { ...model };
    delete temp.is_use_ein;
    return temp;
  });

  watch(() => modelData, () => {
    if (modelData?.ein) {
      model.ein = modelData?.ein;
      model.is_use_ein = 'Yes';
    }
    if (modelData?.type) {
      model.type = modelData?.type;
    }
    if (modelData?.owner_title) {
      model.owner_title = modelData?.owner_title;
    }
    if (modelData?.name) {
      model.name = modelData?.name;
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
    modelExpose,
    optionsType,
    yesNoOptions,
    schemaFrontend,
  };
}; 