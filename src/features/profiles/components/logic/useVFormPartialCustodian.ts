import {
  computed, toRaw, watch, type ComputedRef,
} from 'vue';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { errorMessageRule } from 'UiKit/helpers/validation/rules';
import { useFormValidation } from 'UiKit/helpers/validation/useFormValidation';

export interface FormModelSdira {
  full_account_name: string | undefined;
  type: string | undefined;
  account_number: string | undefined;
}

export const useVFormPartialCustodian = (
  modelData: ComputedRef<FormModelSdira | undefined>,
  schemaBackend: ComputedRef<JSONSchemaType<FormModelSdira> | undefined>,
  isEditMode?: ComputedRef<boolean>,
) => {

  const nameSchema = computed(() => (isEditMode?.value ? 'SdiraEdit' : 'Sdira'));

  const schemaFrontend = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
      Sdira: {
        properties: {
          full_account_name: {},
          type: {},
          account_number: {},
        },
        type: 'object',
        errorMessage: errorMessageRule,
        required: ['full_account_name', 'type', 'account_number'],
      },
    },
    $ref: `#/definitions/${nameSchema.value}`,
  } as unknown as JSONSchemaType<FormModelSdira>;

  const schemaBackendLocal = computed(() => (
    schemaBackend.value ? structuredClone(toRaw(schemaBackend.value)) : undefined));

  const fieldsPaths = ['full_account_name', 'type', 'account_number'];

  const {
    model,
    validation,
    isValid,
    onValidate,
    isFieldRequired,
    getErrorText,
    getOptions,
  } = useFormValidation<FormModelSdira>(
    schemaFrontend,
    schemaBackendLocal,
    {
      full_account_name: '',
      type: '',
      account_number: '',
    },
    fieldsPaths,
  );

  const optionsCustodian = computed(() => getOptions('type'));

  watch(modelData, (newModelData) => {
    if (!newModelData) return;
    const fields = [
      'full_account_name', 'type', 'account_number',
    ] as const;
    fields.forEach((field) => {
      if (newModelData[field] !== undefined && newModelData[field] !== null) {
        model[field] = newModelData[field];
      }
    });
  }, { deep: true, immediate: true });

  return {
    model,
    validation,
    isValid,
    onValidate,
    isFieldRequired,
    getErrorText,
    optionsCustodian,
    schemaFrontend,
  };
};
