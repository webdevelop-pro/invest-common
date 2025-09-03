import {
  computed, nextTick, ref, toRaw,
} from 'vue';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import { urlSignup, urlProfile, urlAuthenticator } from 'InvestCommon/domain/config/links';
import { useRepositoryAuth } from 'InvestCommon/data/auth/auth.repository';
import { useFormValidation } from 'UiKit/helpers/validation/useFormValidation';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { emailRule, errorMessageRule, passwordRule } from 'UiKit/helpers/validation/rules';
import { useHubspotForm } from 'UiKit/composables/useHubspotForm';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { SELFSERVICE } from './type';

type FormModelSignIn = {
  email: string;
  password: string;
}

const HUBSPOT_FORM_ID = '07463465-7f03-42d2-a85e-40cf8e29969d';

export const useLoginStore = defineStore('login', () => {
  const authRepository = useRepositoryAuth();
  const {
    getSchemaState, setLoginState, getAuthFlowState, getLoginState,
  } = storeToRefs(authRepository);
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
          email: emailRule,
          password: passwordRule,
        },
        type: 'object',
        errorMessage: errorMessageRule,
        required: ['email', 'password'],
      },
    },
    $ref: '#/definitions/Auth',
  } as unknown as JSONSchemaType<FormModelSignIn>));

  const schemaBackend = computed(() => (
    getSchemaState.value.data ? structuredClone(toRaw(getSchemaState.value.data)) : null));

  const fieldsPaths = ['email', 'password'];
  const initModel = computed(() => (getQueryParam('email') ? { email: getQueryParam('email') } : {}));

  const {
    model, validation, isValid, onValidate,
    scrollToError, formErrors, isFieldRequired, getErrorText,
    getOptions, getReferenceType,
  } = useFormValidation<FormModelSignIn>(
    schemaFrontend,
    schemaBackend,
    initModel.value as FormModelSignIn,
    fieldsPaths
  );

  const isLoading = ref(false);
  const isDisabledButton = computed(() => !isValid.value || isLoading.value);

  // Navigation
  const onSignup = () => {
    const params = queryParams.value.size ? queryParams.value : undefined;
    return navigateWithQueryParams(urlSignup, params);
  };

  // Form validation
  const validateForm = () => {
    onValidate();
    if (!isValid.value) {
      nextTick(() => scrollToError('LogInForm'));
      return false;
    }
    return true;
  };

  // Login handlers
  const handleLoginSuccess = (session: any) => {
    const { submitFormToHubspot } = useHubspotForm(HUBSPOT_FORM_ID);
    if (model.email) submitFormToHubspot({ email: model.email });
    userSessionStore.updateSession(session);
    navigateWithQueryParams(getQueryParam('redirect') || urlProfile());
  };

  const loginPasswordHandler = async () => {
    if (!validateForm()) return;

    isLoading.value = true;
    try {
      await authRepository.getAuthFlow(SELFSERVICE.login);
      if (getAuthFlowState.value.error) {
        isLoading.value = false;
        return;
      }

      await authRepository.setLogin(authRepository.flowId.value, {
        identifier: model.email,
        password: model.password,
        method: 'password',
        csrf_token: authRepository.csrfToken.value,
      });

      if (setLoginState.value.error) {
        isLoading.value = false;
        return;
      }

      if (setLoginState.value.data?.session) {
        handleLoginSuccess(setLoginState.value.data.session);
      }
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      isLoading.value = false;
    }
  };

  const loginSocialHandler = async (provider: string) => {
    console.log('Social login initiated for provider:', provider);
    isLoading.value = true;
    try {
      const flowId = getQueryParam('flow');
      console.log('Using query flow ID:', flowId);
      await authRepository.getAuthFlow(SELFSERVICE.login);
      if (getAuthFlowState.value.error) return;

      await authRepository.setLogin(flowId || authRepository.flowId.value, {
        csrf_token: authRepository.csrfToken.value,
        provider,
        method: 'oidc',
      });
    } catch (error) {
      console.error('Social login failed:', error);
    } finally {
      isLoading.value = false;
    }
  };

  const onMountedHandler = async () => {
    if (getQueryParam('flow')) {
      await authRepository.getLogin(getQueryParam('flow')!);
      if (getLoginState.value.data.requested_aal === 'aal2') {
        navigateWithQueryParams(urlAuthenticator);
      }
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
    setLoginState,
    onSignup,
    loginPasswordHandler,
    loginSocialHandler,
    onValidate,
    isValid,
    getQueryParam,
    onMountedHandler,
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
  import.meta.hot.accept(acceptHMRUpdate(useLoginStore, import.meta.hot));
}
