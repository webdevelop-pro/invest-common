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
import { SELFSERVICE } from 'InvestCommon/data/auth/auth.constants';
import { oryErrorHandling } from 'InvestCommon/domain/error/oryErrorHandling';
import { oryResponseHandling } from 'InvestCommon/domain/error/oryResponseHandling';
import { useSendAnalyticsEvent } from 'InvestCommon/domain/analytics/useSendAnalyticsEvent';
import {
  shouldAutoAuthenticateDemoAccount,
  useDemoAccountAuth,
} from 'InvestCommon/features/auth/composables/useDemoAccountAuth';
import { notifyAndroidNativePushAuthSuccess } from 'InvestCommon/domain/nativePush/nativePushBridge';

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
  const { sendEvent } = useSendAnalyticsEvent();
  const demoAccountAuth = useDemoAccountAuth();

  const resetLoginFlow = () => {
    void authRepository
      .getAuthFlow(SELFSERVICE.login)
      .then((flow) => oryResponseHandling(flow as any));
  };

  const trackLoginEvent = async (statusCode: number, body?: unknown) => {
    const uiPath = typeof window !== 'undefined' ? window.location.pathname : '';
    await sendEvent({
      event_type: 'send',
      method: 'POST',
      httpRequestMethod: 'POST',
      service_name: 'vue3-app',
      request_id: authRepository.flowId.value,
      request_path: uiPath,
      httpRequestUrl: SELFSERVICE.login,
      status_code: statusCode,
      body,
    });
  };

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
  const handleLoginSuccess = async () => {
    const { submitFormToHubspot } = useHubspotForm(HUBSPOT_FORM_ID);
    if (model.email) await submitFormToHubspot({ email: model.email });
    navigateWithQueryParams(getQueryParam('redirect') || urlProfile());
  };

  const buildPasswordLoginRequestBody = () => ({
    identifier: model.email,
    password: model.password,
    method: 'password' as const,
    csrf_token: authRepository.csrfToken.value,
  });

  const buildSocialLoginRequestBody = (provider: string) => ({
    csrf_token: authRepository.csrfToken.value,
    provider,
    method: 'oidc' as const,
  });

  const loginPasswordHandler = async () => {
    if (!validateForm()) return;

    let loginRequestBody: ReturnType<typeof buildPasswordLoginRequestBody> | undefined;
    isLoading.value = true;
    try {
      const flowData = await authRepository.getAuthFlow(SELFSERVICE.login);
      oryResponseHandling(flowData);
      if (getAuthFlowState.value.error) {
        isLoading.value = false;
        return;
      }

      loginRequestBody = buildPasswordLoginRequestBody();
      await authRepository.setLogin(authRepository.flowId.value, loginRequestBody);

      if (setLoginState.value.error) {
        void trackLoginEvent(400, loginRequestBody);
        isLoading.value = false;
        return;
      }
    } catch (error) {
      void trackLoginEvent(400, loginRequestBody ?? buildPasswordLoginRequestBody());
      await oryErrorHandling(
        error as any,
        'login',
        resetLoginFlow,
        'Failed to login',
      );
    } finally {
      isLoading.value = false;
    }

    if (setLoginState.value.data?.session && loginRequestBody) {
      const session = setLoginState.value.data.session;
      userSessionStore.updateSession(session);
      notifyAndroidNativePushAuthSuccess();
      await trackLoginEvent(200, loginRequestBody);
      await handleLoginSuccess();
    }
  };

  const loginSocialHandler = async (provider: string) => {
    let loginRequestBody: ReturnType<typeof buildSocialLoginRequestBody> | undefined;
    isLoading.value = true;
    try {
      const flowId = getQueryParam('flow');
      const flowData = await authRepository.getAuthFlow(SELFSERVICE.login);
      oryResponseHandling(flowData);
      if (getAuthFlowState.value.error) return;

      loginRequestBody = buildSocialLoginRequestBody(provider);
      await authRepository.setLogin(flowId || authRepository.flowId.value, loginRequestBody);
    } catch (error) {
      void trackLoginEvent(400, loginRequestBody ?? buildSocialLoginRequestBody(provider));
      await oryErrorHandling(
        error as any,
        'login',
        resetLoginFlow,
        'Failed to login',
      );
    } finally {
      isLoading.value = false;
    }
  };

  const demoAccountHandler = async () => demoAccountAuth.authenticate();

  const onMountedHandler = async () => {
    const currentFlowId = getQueryParam('flow');

    if (currentFlowId) {
      try {
        const data = await authRepository.getLogin(currentFlowId);
        oryResponseHandling(data);
        if (getLoginState.value.data?.requested_aal === 'aal2') {
          navigateWithQueryParams(urlAuthenticator);
        }
      } catch (error) {
        await oryErrorHandling(
          error as any,
          'login',
          resetLoginFlow,
          'Failed to get login data',
        );
      }

      return;
    }

    if (typeof window === 'undefined' || !shouldAutoAuthenticateDemoAccount(window.location.search)) {
      return;
    }

    await demoAccountHandler();
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
    demoAccountHandler,
    isDemoAccountAvailable: demoAccountAuth.isAvailable,
    isDemoAccountLoading: demoAccountAuth.isLoading,
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
