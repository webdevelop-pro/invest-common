import {
  computed, nextTick, ref, toRaw,
} from 'vue';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { useRepositoryAuth } from 'InvestCommon/data/auth/auth.repository';
import { useFormValidation } from 'UiKit/helpers/validation/useFormValidation';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import { urlProfile } from 'InvestCommon/domain/config/links';
import { useHubspotForm } from 'UiKit/composables/useHubspotForm';
import { SELFSERVICE, AAL2_QUERY } from 'InvestCommon/data/auth/auth.constants';
import { oryErrorHandling } from 'InvestCommon/domain/error/oryErrorHandling';
import { oryResponseHandling } from 'InvestCommon/domain/error/oryResponseHandling';

type FormModelTOTP = {
    totp_code: number;
}

const HUBSPOT_FORM_ID = '07463465-7f03-42d2-a85e-40cf8e29969d';

export const useAuthenticatorStore = defineStore('authenticator', () => {
  const authRepository = useRepositoryAuth();
  const { getSchemaState, setLoginState } = storeToRefs(authRepository);
  const userSessionStore = useSessionStore();

  // Query parameters handling
  const queryParams = computed(() => {
    if (import.meta.env.SSR) return new Map<string, string>();
    return new Map(Object.entries(Object.fromEntries(new URLSearchParams(window?.location?.search))));
  });

  const getQueryParam = (key: string): string | undefined => queryParams.value.get(key);

  // Form schema and validation
  const schemaFrontend = computed(() => ({
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
      Auth: {
        properties: {
          totp_code: {},
        },
        type: 'object',
        required: ['totp_code'],
      },
    },
    $ref: '#/definitions/Auth',
  } as unknown as JSONSchemaType<FormModelTOTP>));

  const schemaBackend = computed(() => (
    getSchemaState.value.data ? structuredClone(toRaw(getSchemaState.value.data)) : null));

  const fieldsPaths = ['totp_code'];

  const {
    model, validation, isValid, onValidate,
    scrollToError, formErrors, isFieldRequired, getErrorText,
    getOptions, getReferenceType,
  } = useFormValidation<FormModelTOTP>(
    schemaFrontend,
    schemaBackend,
    {} as FormModelTOTP,
    fieldsPaths
  );

  const isLoading = ref(false);
  const isDisabledButton = computed(() => !isValid.value || isLoading.value);

  // Form validation
  const validateForm = () => {
    onValidate();
    if (!isValid.value) {
      nextTick(() => scrollToError('VFormAuthAuthenticator'));
      return false;
    }
    return true;
  };

  const navigateToProfile = () => {
    const redirectUrl = getQueryParam('redirect') || urlProfile();
    return navigateWithQueryParams(redirectUrl);
  };

  const handleSuccess = (session: any) => {
    const { submitFormToHubspot } = useHubspotForm(HUBSPOT_FORM_ID);
    if (model.email) submitFormToHubspot({ email: model.email });
    userSessionStore.updateSession(session);
    navigateToProfile();
  };

  const totpHandler = async () => {
    if (!validateForm()) return;

    isLoading.value = true;
    try {
      await authRepository.setLogin(authRepository.flowId.value, {
        totp_code: model.totp_code.toString(),
        method: 'totp',
        csrf_token: authRepository.csrfToken.value,
      });

      if (setLoginState.value.error) {
        isLoading.value = false;
        return;
      }

      if (setLoginState.value.data?.session) {
        handleSuccess(setLoginState.value.data.session);
      }
    } catch (error) {
      await oryErrorHandling(error as any, 'login', () => authRepository.getAuthFlow(SELFSERVICE.login, AAL2_QUERY), 'Failed to login');
    } finally {
      isLoading.value = false;
    }
  };

  const onMountedHandler = async () => {
    try {
      const flowData = await authRepository.getAuthFlow(SELFSERVICE.login, AAL2_QUERY);
      oryResponseHandling(flowData);
    } catch (error) {
      await oryErrorHandling(error as any, 'browser', () => {}, 'Failed to get auth flow');
    }
  };

  return {
    isLoading,
    model,
    validation,
    schemaBackend,
    schemaFrontend,
    isDisabledButton,
    setLoginState,
    totpHandler,
    onValidate,
    isValid,
    onMountedHandler,
    navigateToProfile,
    getQueryParam,
    // Form validation helpers
    formErrors,
    isFieldRequired,
    getErrorText,
    getOptions,
    getReferenceType,
    scrollToError,

  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthenticatorStore, import.meta.hot));
}
