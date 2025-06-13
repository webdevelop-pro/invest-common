import {
  computed, nextTick, ref, toRaw,
} from 'vue';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { useRepositoryAuth } from 'InvestCommon/data/auth/auth.repository';
import { useFormValidation } from 'InvestCommon/composable/useFormValidation';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { SELFSERVICE } from './type';
import { codeRule, errorMessageRule } from 'UiKit/helpers/validation/rules';
import { urlCheckEmail } from 'InvestCommon/global/links';
import { navigateWithQueryParams } from 'UiKit/helpers/general';

type FormModelVerification = {
  code: string;
}

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
    console.log('Verification handler called');
    if (!validateForm()) return;

    isLoading.value = true;
    try {
      console.log('setRecovery');
      await authRepository.setRecovery(flowId.value, {
        code: model.code,
        method: 'code',
        csrf_token: authRepository.csrfToken.value,
      });
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      isLoading.value = false;
    }
  };

  const resendHandler = async () => {
    isLoading.value = true;
    try {
      await authRepository.getAuthFlow(SELFSERVICE.recovery);
      if (getAuthFlowState.value.error) {
        isLoading.value = false;
        return;
      }

      await authRepository.setRecovery(authRepository.flowId.value, {
        email: email.value,
        method: 'code',
        csrf_token: authRepository.csrfToken.value,
      });

      if (setRecoveryState.value.error) {
        isLoading.value = false;
        return;
      }

      if (setRecoveryState.value.data.state === 'sent_email') {
        navigateWithQueryParams(urlCheckEmail, { email : email.value, flowId: authRepository.flowId.value });
      }
    } catch (error) {
      console.error('Resend verification code failed:', error);
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
    resendHandler,
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
