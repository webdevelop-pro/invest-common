import {
  watch, computed,
  ref, defineAsyncComponent,
} from 'vue';
import { storeToRefs } from 'pinia';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import {
  emailRule, errorMessageRule, firstNameRule, lastNameRule,
  phoneRule,
} from 'UiKit/helpers/validation/rules';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useFormValidation } from 'UiKit/helpers/validation/useFormValidation';

export interface FormModelAccount {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}

interface UseAccountFormProps {
  modelData?: FormModelAccount;
  readOnly?: boolean;
}

export function useAccountForm(props: UseAccountFormProps) {
  const useRepositoryProfilesStore = useRepositoryProfiles();
  const { setUserState, setUserOptionsState } = storeToRefs(useRepositoryProfilesStore);

  const errorData = computed(() => (setUserState.value.error as any)?.data?.responseJson);
  const schemaBackend = computed(() => setUserOptionsState.value.data);

  const schema = computed(() => ({
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
      UserUpdate: {
        properties: {
          first_name: firstNameRule,
          last_name: lastNameRule,
          email: emailRule,
          phone: phoneRule,
        },
        type: 'object',
        errorMessage: errorMessageRule,
        required: ['first_name', 'last_name', 'email'],
      },
    },
    $ref: '#/definitions/UserUpdate',
  } as unknown as JSONSchemaType<FormModelAccount>));

  const fieldsPaths = ['first_name', 'last_name', 'email', 'phone'];

  const isDialogContactUsOpen = ref(false);

  const VDialogContactUs = defineAsyncComponent({
    loader: () => import('InvestCommon/shared/components/dialogs/VDialogContactUs.vue'),
  });

  const {
    model,
    validation,
    isValid,
    onValidate,
    validator,
    scrollToError, formErrors, isFieldRequired, getErrorText,
    getOptions, getReferenceType,
  } = useFormValidation<FormModelAccount>(
    schema,
    schemaBackend,
    {} as FormModelAccount,
    fieldsPaths
  );

  // Watch for model data changes and update form
  watch(() => props.modelData, () => {
    if (props.modelData?.first_name) model.first_name = props.modelData?.first_name;
    if (props.modelData?.last_name) model.last_name = props.modelData?.last_name;
    if (props.modelData?.email) model.email = props.modelData?.email;
    if (props.modelData?.phone) model.phone = props.modelData?.phone;
  }, { deep: true, immediate: true });

  // Watch for model changes and validate
  watch(() => model, () => {
    if (!isValid.value) onValidate();
  }, { deep: true });

  return {
    model,
    validation,
    isValid,
    onValidate,
    validator,
    errorData,
    schemaBackend,
    schema,
    isDialogContactUsOpen,
    VDialogContactUs,
    setUserState,
    
    // Form validation helpers
    formErrors,
    isFieldRequired,
    getErrorText,
    getOptions,
    getReferenceType,
    scrollToError,
  };
}
