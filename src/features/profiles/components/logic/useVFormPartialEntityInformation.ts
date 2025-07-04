import { computed, reactive, toRaw, watch } from 'vue';
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
  modelData: FormModelEntityInformation | undefined,
  schemaBackend: JSONSchemaType<FormModelEntityInformation> | undefined,
  errorData: any,
  loading: boolean,
  showDocument: boolean = false,
) => {
  let modelLocal = reactive<FormModelEntityInformation>({
    solely_for_investing: modelData?.solely_for_investing || 'No',
    tax_exempts: modelData?.tax_exempts || 'No',
    type: modelData?.type,
    owner_title: modelData?.owner_title,
    name: modelData?.name,
    formation_document_id: modelData?.formation_document_id,
    organization_document_id: modelData?.organization_document_id,
    operating_agreement_id: modelData?.operating_agreement_id,
  });

  const required = computed(() => {
    const baseRequired = ['type', 'solely_for_investing', 'tax_exempts', 'name', 'owner_title'];
    if (showDocument) {
      baseRequired.push('operating_agreement_id');
    }
    return baseRequired;
  });

  const schemaFrontend = {
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
  } as unknown as JSONSchemaType<FormModelEntityInformation>;

  const schemaBackendLocal = computed(() => (schemaBackend ? structuredClone(toRaw(schemaBackend)) : null));

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

  watch(() => modelData, (newModelData) => {
    if (!newModelData) return;
    const fields = [
      'solely_for_investing', 'tax_exempts', 'type', 'owner_title', 'name', 'formation_document_id', 'organization_document_id', 'operating_agreement_id',
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
    yesNoOptions,
    schemaFrontend,
    optionsType,
    operatingAgreementLabel,
  };
}; 