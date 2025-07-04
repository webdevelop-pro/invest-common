import { computed, reactive, ref, toRaw, watch } from 'vue';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { errorMessageRule } from 'UiKit/helpers/validation/rules';
import { useFormValidation } from 'InvestCommon/composable/useFormValidation';
import { getOptions } from 'UiKit/helpers/model';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { storeToRefs } from 'pinia';

export interface FormModelSdira {
  full_account_name: string | undefined;
  type: string | undefined;
  account_number: string | undefined;
}

export const useVFormPartialCustodian = (
  modelData: FormModelSdira | undefined,
) => {
  const useRepositoryProfilesStore = useRepositoryProfiles();
  const { getProfileByIdOptionsState } = storeToRefs(useRepositoryProfilesStore);

  const schemaBackend = computed(() => getProfileByIdOptionsState.value.data);

  let modelLocal = reactive<FormModelSdira>({
    full_account_name: modelData?.full_account_name,
    type: modelData?.type,
    account_number: modelData?.account_number,
  });

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
    $ref: '#/definitions/Sdira',
  } as unknown as JSONSchemaType<FormModelSdira>;


  const {
    model,
    validation,
    isValid,
    onValidate,
    schemaObject,
  } = useFormValidation<FormModelSdira>(
    schemaFrontend,
    schemaBackend,
    modelLocal,
  );

  const optionsCustodian = computed(() => getOptions('type', schemaObject));

  watch(() => modelData, (newModelData) => {
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

  watch(() => model, () => {
    modelLocal = model;
  }, { deep: true, immediate: true });

  return {
    model,
    validation,
    isValid,
    onValidate,
    optionsCustodian,
    schemaFrontend,
  };
}; 