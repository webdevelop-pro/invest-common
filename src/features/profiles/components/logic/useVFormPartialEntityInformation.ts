import { computed, reactive, toRaw, watch, ComputedRef, ref } from 'vue';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { errorMessageRule } from 'UiKit/helpers/validation/rules';
import { useFormValidation } from 'InvestCommon/composable/useFormValidation';
import { getOptions } from 'UiKit/helpers/model';

export const yesNoOptions = [
  { value: 'Yes', text: 'Yes' },
  { value: 'No', text: 'No' },
];

export interface FormModelEntityInformation {
  solely_for_investing: string;
  tax_exempts: string;
  type: string | undefined;
  owner_title: string | undefined;
  name: string | undefined;
  formation_document_id?: number | string | undefined;
  organization_document_id?: number | string | undefined;
  operating_agreement_id?: number | string | undefined;
}

export const useVFormPartialEntityInformation = (
  modelData: ComputedRef<FormModelEntityInformation | undefined>,
  schemaBackend: ComputedRef<JSONSchemaType<FormModelEntityInformation> | undefined>,
  errorData: ComputedRef<any>,
  loading: ComputedRef<boolean>,
  showDocument: ComputedRef<boolean> = computed(() => false),
) => {
  let modelLocal = reactive<FormModelEntityInformation>({
    solely_for_investing: modelData.value?.solely_for_investing || 'No',
    tax_exempts: modelData.value?.tax_exempts || 'No',
    type: modelData.value?.type,
    owner_title: modelData.value?.owner_title,
    name: modelData.value?.name,
    formation_document_id: modelData.value?.formation_document_id,
    organization_document_id: modelData.value?.organization_document_id,
    operating_agreement_id: modelData.value?.operating_agreement_id,
  });

  const required = computed(() => {
    const baseRequired = ['type', 'solely_for_investing', 'tax_exempts', 'name', 'owner_title'];
    if (showDocument.value) {
      baseRequired.push('operating_agreement_id');
    }
    return baseRequired;
  });

  const schemaFrontend = computed(() => ({
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
      Entity: {
        properties: {
          type: {},
          solely_for_investing: {},
          tax_exempts: {},
          name: {},
          owner_title: {},
          formation_document_id: {},
          organization_document_id: {},
          operating_agreement_id: {},
        },
        type: 'object',
        errorMessage: errorMessageRule,
        required: required.value,
      },
    },
    $ref: '#/definitions/Entity',
  })) as unknown as ComputedRef<JSONSchemaType<FormModelEntityInformation>>;

  const schemaBackendLocal = computed(() => (schemaBackend.value ? structuredClone(toRaw(schemaBackend.value)) : null));

  const {
    model,
    validation,
    isValid,
    onValidate,
    schemaObject,
  } = useFormValidation<FormModelEntityInformation>(
    schemaFrontend,
    schemaBackendLocal,
    modelLocal,
  );

  const optionsType = computed(() => getOptions('type', schemaObject));

  const operatingAgreementLabel = computed(() => {
    const entityType = model.type;
    
    switch (entityType) {
      case 'LLC':
        return 'Operating Agreement';
      case 'Corporation':
        return 'Bylaws';
      case 'Limited Partnership':
      case 'General Partnership':
        return 'Partnership Agreement';
      default:
        return 'Operating Agreement';
    }
  });

  watch(() => modelData.value, (newModelData) => {
    if (!newModelData) return;
    const fields = [
      'solely_for_investing', 'tax_exempts', 'type', 'owner_title', 'name', 'formation_document_id', 'organization_document_id', 'operating_agreement_id',
    ] as const;
    fields.forEach((field) => {
      if (newModelData[field] !== undefined && newModelData[field] !== null) {
        model[field] = newModelData[field] as any;
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
    yesNoOptions,
    schemaFrontend,
    optionsType,
    operatingAgreementLabel,
  };
}; 