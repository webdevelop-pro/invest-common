import { computed, reactive, toRaw, watch, type ComputedRef } from 'vue';
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
  modelData: ComputedRef<FormModelPlanInformation | undefined>,
  schemaBackend: ComputedRef<JSONSchemaType<FormModelPlanInformation> | undefined>,
  showDocument: ComputedRef<boolean>,
) => {
  let modelLocal = reactive<FormModelPlanInformation>({
    name: modelData.value?.name,
    is_use_ein: modelData.value?.is_use_ein || (modelData.value?.ein ? 'Yes' : 'No'),
    ein: modelData.value?.ein,
  });

  const required = computed(() => {
    const baseRequired = ['name', 'is_use_ein'];
    if (modelLocal.is_use_ein && modelLocal.is_use_ein === 'Yes') {
      baseRequired.push('ein');
    }
    if (showDocument.value) {
      baseRequired.push('plan_document_id');
    }
    return baseRequired;
  });

  const schemaFrontend = computed(() => ({
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
  })) as unknown as ComputedRef<JSONSchemaType<FormModelPlanInformation>>;

  const schemaBackendLocal = computed(() => {
    const backendSchema = schemaBackend.value;
    return backendSchema ? structuredClone(toRaw(backendSchema)) : null;
  });

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

  watch(() => modelData.value, () => {
    const currentModelData = modelData.value;
    if (currentModelData?.name) {
      model.name = currentModelData.name;
    }
    if (currentModelData?.ein) {
      model.ein = currentModelData.ein;
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