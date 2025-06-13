import {
  computed, nextTick, ref, toRaw,
} from 'vue';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { useRepositoryAuth } from 'InvestCommon/data/auth/auth.repository';
import { useFormValidation } from 'InvestCommon/composable/useFormValidation';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { codeRule, errorMessageRule } from 'UiKit/helpers/validation/rules';
import { useToast } from 'UiKit/components/Base/VToast/use-toast';
import { SELFSERVICE } from './type';

type FormModelVerification = {
  code: string;
}
const { toast } = useToast();

const TOAST_OPTIONS = {
  title: 'Something went wrong',
  description: 'Please try again',
  variant: 'error',
};

export const useVerificationStore = defineStore('verification', () => {
  const authRepository = useRepositoryAuth();
  const { getSchemaState, setRecoveryState, getAuthFlowState } = storeToRefs(authRepository);

  // Query parameters handling
  const queryParams = computed(() => {
    if (import.meta.env.SSR) return new Map<string, string>();
    return new Map(Object.entries(Object.fromEntries(new URLSearchParams(window?.location?.search))));
  });

  const getQueryParam = (key: string): string | undefined => queryParams.value.get(key);

  const flowId = computed(() => getQueryParam('flowId'));
  const email = computed(() => getQueryParam('email'));

  // Form schema and validation
  const schemaFrontend = computed(() => ({
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
      Auth: {
        properties: {
          code: codeRule,
        },
        type: 'object',
        required: ['code'],
        errorMessage: errorMessageRule,
      },
    },
    $ref: '#/definitions/Auth',
  } as unknown as JSONSchemaType<FormModelVerification>));

  const schemaBackend = computed(() => (getSchemaState.value.data ? structuredClone(toRaw(getSchemaState.value.data)) : null));

  const {
    model, validation, isValid, onValidate,
  } = useFormValidation<FormModelVerification>(schemaFrontend.value, schemaBackend.value, {} as FormModelVerification);

  const isLoading = ref(false);
  const isDisabledButton = computed(() => !isValid.value || isLoading.value);

  // Form validation
  const validateForm = () => {
    onValidate();
    if (!isValid.value) {
      nextTick(() => scrollToError('VFormAuthVerification'));
      return false;
    }
    return true;
  };

  // Verification handlers
  const verificationHandler = async () => {
    if (!validateForm()) return;

    isLoading.value = true;
    try {
      await authRepository.getAuthFlow(SELFSERVICE.recovery);
      if (getAuthFlowState.value.error) {
        isLoading.value = false;
        return;
      }
      await authRepository.setRecovery(flowId.value, {
        code: model.code,
        method: 'code',
        csrf_token: authRepository.csrfToken.value,
      });

      const uiMessage = setRecoveryState.value.data.ui?.messages?.find((m: any) => m.type === 'error')?.text;
      const uiNodeMessage = setRecoveryState.value.data.ui?.nodes?.find((node: any) => node.messages?.some((m: any) => m.type === 'error'))?.messages?.find((m: any) => m.type === 'error')?.text;
      
      // Check if there are any error messages in the UI structure
      const hasErrorMessages = setRecoveryState.value.data.ui?.messages?.some((m: any) => m.type === 'error');
      const hasErrorNodes = setRecoveryState.value.data.ui?.nodes?.some((node: any) => 
        node.messages?.some((m: any) => m.type === 'error')
      );

      if (hasErrorMessages || hasErrorNodes) {
        const errorMessage = uiMessage || uiNodeMessage || TOAST_OPTIONS.description;
        toast({
          title: 'Failed to set recovery',
          description: errorMessage,
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Recovery failed:', error);
    } finally {
      isLoading.value = false;
    }
  };

  return {
    queryParams,
    isLoading,
    model,
    validation,
    schemaBackend,
    schemaFrontend,
    isDisabledButton,
    setRecoveryState,
    verificationHandler,
    onValidate,
    isValid,
    getQueryParam,
    flowId,
    email,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useVerificationStore, import.meta.hot));
}
