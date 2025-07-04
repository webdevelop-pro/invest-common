import { computed, reactive, toRaw, watch } from 'vue';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { errorMessageRule } from 'UiKit/helpers/validation/rules';
import { useFormValidation } from 'InvestCommon/composable/useFormValidation';

const yesNoOptions = [
  { value: 'Yes', text: 'Yes' },
  { value: 'No', text: 'No' },
];

export interface FormModelPlanInformation {
  name: string | undefined;
  is_use_ein: string | undefined;
  ein?: string | undefined;
  plan_document_id?: number | string | undefined;
}

export const useVFormPartialPlanInformation = (
  modelData: FormModelPlanInformation | undefined,
  schemaBackend: JSONSchemaType<FormModelPlanInformation> | undefined,
  showDocument: boolean,
) => {
  let modelLocal = reactive<FormModelPlanInformation>({
    name: modelData?.name,
    is_use_ein: modelData?.is_use_ein || (modelData?.ein ? 'Yes' : 'No'),
    ein: modelData?.ein,
  });

  const required = computed(() => {
    const baseRequired = ['name', 'is_use_ein'];
    if (modelLocal.is_use_ein && modelLocal.is_use_ein === 'Yes') {
      baseRequired.push('ein');
    }
    if (showDocument) {
      baseRequired.push('plan_document_id');
    }
    return baseRequired;
  });

  const schemaFrontend = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
      Solo401k: {
        properties: {
          name: {},
          is_use_ein: {},
          ein: {},
          plan_document_id: {},
        },
        type: 'object',
        errorMessage: errorMessageRule,
        required: required.value,
      },
    },
    $ref: '#/definitions/Solo401k',
  } as unknown as JSONSchemaType<FormModelPlanInformation>;

  const schemaBackendLocal = computed(() => (schemaBackend ? structuredClone(toRaw(schemaBackend)) : null));

  const {
    model,
    validation,
    isValid,
    onValidate,
    schemaObject,
  } = useFormValidation<FormModelPlanInformation>(
    schemaFrontend,
    schemaBackendLocal,
    modelLocal,
  );

  const modelExpose = computed(() => {
    const temp = { ...model };
    delete temp.is_use_ein;
    return temp;
  });

  watch(() => modelData, () => {
    if (modelData?.name) {
      model.name = modelData?.name;
    }
    if (modelData?.ein) {
      model.ein = modelData?.ein;
      model.is_use_ein = 'Yes';
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
    yesNoOptions,
    schemaFrontend,
  };
}; 