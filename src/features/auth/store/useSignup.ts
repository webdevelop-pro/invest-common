import {
  computed, nextTick, ref, toRaw,
} from 'vue';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import { urlSignin, urlProfile } from 'InvestCommon/domain/config/links';
import { useRepositoryAuth } from 'InvestCommon/data/auth/auth.repository';
import { useFormValidation } from 'UiKit/helpers/validation/useFormValidation';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import {
  emailRule, errorMessageRule, passwordRule, firstNameRule, lastNameRule,
} from 'UiKit/helpers/validation/rules';
import { useHubspotForm } from 'UiKit/composables/useHubspotForm';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { SELFSERVICE } from 'InvestCommon/data/auth/auth.constants';
import { oryErrorHandling } from 'InvestCommon/domain/error/oryErrorHandling';
import { oryResponseHandling } from 'InvestCommon/domain/error/oryResponseHandling';
import { useSendAnalyticsEvent } from 'InvestCommon/domain/analytics/useSendAnalyticsEvent';
import { useDemoAccountAuth } from 'InvestCommon/features/auth/composables/useDemoAccountAuth';

const HUBSPOT_FORM_ID = '726ad71f-e168-467f-9847-25e9377f69cf';

type FormModelSignUp = {
  first_name: string;
  last_name: string;
  email: string;
  create_password: string;
  repeat_password: string;
  provider?: string;
}

type UINode = {
  attributes: {
    name: string;
    value: string | undefined;
  };
};

type FormFieldMapping = {
  [key: string]: (value: string | undefined) => void;
};

export const useSignupStore = defineStore('signup', () => {
  const authRepository = useRepositoryAuth();
  const {
    getSchemaState, setSignupState, getSignupState, getAuthFlowState,
  } = storeToRefs(authRepository);

  const userSessionStore = useSessionStore();
  const { sendEvent } = useSendAnalyticsEvent();
  const demoAccountAuth = useDemoAccountAuth();

  const resetSignupFlow = () => {
    void authRepository
      .getAuthFlow(SELFSERVICE.registration)
      .then((flow) => oryResponseHandling(flow as any));
  };

  const trackSignupEvent = async (statusCode: number, body?: unknown) => {
    const uiPath = typeof window !== 'undefined' ? window.location.pathname : '';
    await sendEvent({
      event_type: 'send',
      method: 'POST',
      httpRequestMethod: 'POST',
      service_name: 'vue3-app',
      request_id: authRepository.flowId.value,
      request_path: uiPath,
      httpRequestUrl: SELFSERVICE.registration,
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

  const title = computed(() => (getQueryParam('flow') ? 'Finish Registration' : 'Create Account'));

  const queryFlow = computed(() => getQueryParam('flow'));

  // Form schema and validation
  const schemaFrontend = computed(() => ({
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
      Auth: {
        properties: {
          first_name: firstNameRule,
          last_name: lastNameRule,
          email: emailRule,
          create_password: passwordRule,
          repeat_password: {
            const: {
              $data: '1/create_password',
            },
            ...passwordRule,
            errorMessage: {
              const: 'Passwords do not match',
            },
          },
        },
        type: 'object',
        required: ['first_name', 'last_name', 'email', 'create_password', 'repeat_password'],
        errorMessage: errorMessageRule,
      },
    },
    $ref: '#/definitions/Auth',
  } as unknown as JSONSchemaType<FormModelSignUp>));

  const schemaBackend = computed(() => {
    if (getSchemaState.value.data) {
      return structuredClone(toRaw(getSchemaState.value.data));
    }
    return null;
  });

  const fieldsPaths = ['first_name', 'last_name', 'email', 'create_password', 'repeat_password'];

  const {
    model, validation, isValid, onValidate,
    scrollToError, formErrors, isFieldRequired, getErrorText,
    getOptions, getReferenceType,
  } = useFormValidation<FormModelSignUp>(
    schemaFrontend,
    schemaBackend,
    {} as FormModelSignUp,
    fieldsPaths
  );

  const isLoading = ref(false);
  const checkbox = ref(false);
  const isDisabledButton = computed(() => (!isValid.value || isLoading.value || !checkbox.value));

  // Navigation
  const onLogin = () => {
    const params = queryParams.value.size ? queryParams.value : undefined;
    return navigateWithQueryParams(urlSignin, params);
  };

  const navigateToProfile = () => {
    const redirectUrl = getQueryParam('redirect') || urlProfile();
    return navigateWithQueryParams(redirectUrl);
  };

  // Form validation
  const validateForm = () => {
    onValidate();
    if (!isValid.value) {
      nextTick(() => scrollToError('VFormAuthSignup'));
      return false;
    }
    return true;
  };

  const buildPasswordSignupRequestBody = () => ({
    identifier: model.email,
    password: model.create_password,
    method: 'password' as const,
    traits: {
      email: model.email,
      first_name: model.first_name,
      last_name: model.last_name,
    },
    csrf_token: authRepository.csrfToken.value,
  });

  const buildSocialSignupRequestBody = (provider: string) => ({
    csrf_token: authRepository.csrfToken.value,
    provider,
    method: 'oidc' as const,
  });

  // Signup handlers
  const handleSignupSuccess = async () => {
    const { submitFormToHubspot } = useHubspotForm(HUBSPOT_FORM_ID);
    if (model.email) {
      await submitFormToHubspot({
        email: model.email,
        firstname: model.first_name,
        lastname: model.last_name,
      });
    }
    navigateToProfile();
  };

  const signupPasswordHandler = async () => {
    if (!checkbox.value) return;
    if (!validateForm()) return;

    let signupRequestBody: ReturnType<typeof buildPasswordSignupRequestBody> | undefined;
    isLoading.value = true;
    try {
      const flowData = await authRepository.getAuthFlow(SELFSERVICE.registration);
      oryResponseHandling(flowData);
      if (getAuthFlowState.value.error) return;

      signupRequestBody = buildPasswordSignupRequestBody();
      await authRepository.setSignup(authRepository.flowId.value, signupRequestBody);

      if (setSignupState.value.error) {
        void trackSignupEvent(400, signupRequestBody);
        return;
      }
    } catch (error) {
      void trackSignupEvent(400, signupRequestBody ?? buildPasswordSignupRequestBody());
      await oryErrorHandling(
        error as any,
        'signup',
        resetSignupFlow,
        'Failed to signup',
      );
    } finally {
      isLoading.value = false;
    }

    if (setSignupState.value.data?.session && signupRequestBody) {
      const session = setSignupState.value.data.session;
      userSessionStore.updateSession(session);
      await trackSignupEvent(200, signupRequestBody);
      await handleSignupSuccess();
    }
  };

  const signupSocialHandler = async (provider: string) => {
    let signupRequestBody: ReturnType<typeof buildSocialSignupRequestBody> | undefined;
    isLoading.value = true;
    try {
      const currentFlowId = getQueryParam('flow');
      if (!currentFlowId) {
        const flowData = await authRepository.getAuthFlow(SELFSERVICE.registration);
        oryResponseHandling(flowData);
        if (getAuthFlowState.value.error) return;
      }

      signupRequestBody = buildSocialSignupRequestBody(provider);
      await authRepository.setSignup(
        currentFlowId || authRepository.flowId.value,
        signupRequestBody,
      );
    } catch (error) {
      void trackSignupEvent(400, signupRequestBody ?? buildSocialSignupRequestBody(provider));
      await oryErrorHandling(
        error as any,
        'signup',
        resetSignupFlow,
        'Failed to signup',
      );
    } finally {
      isLoading.value = false;
    }
  };

  const demoAccountHandler = async () => demoAccountAuth.authenticate();

  /**
   * Maps form fields from UI nodes to the form model
   * @param nodes - Array of UI nodes containing form field data
   */
  const mapFormFields = (nodes: UINode[]): void => {
    const fieldMappings: FormFieldMapping = {
      'traits.email': (value) => { model.email = value ?? ''; },
      'traits.first_name': (value) => { model.first_name = value ?? ''; },
      'traits.last_name': (value) => { model.last_name = value ?? ''; },
      provider: (value) => { model.provider = value ?? ''; },
    };

    nodes.forEach((item) => {
      const { name, value } = item.attributes;

      if (fieldMappings[name]) {
        fieldMappings[name](value);
      } else if (name === 'traits.name' && !model.first_name && !model.last_name) {
        const nameSplitted = value?.trim().split(/\s+/);
        if (nameSplitted && nameSplitted.length > 0) {
          model.first_name = nameSplitted[0];
          model.last_name = nameSplitted[nameSplitted.length - 1];
        }
      }
    });
  };

  /**
   * Initializes form data from query flow if present
   */
  const onMountedHandler = (async (): Promise<void> => {
    if (!queryFlow.value) return;

    try {
      if (!getSignupState.value.data) {
        const data = await authRepository.getSignup(queryFlow.value);
        oryResponseHandling(data);
      }

      if (getSignupState.value.data?.ui?.nodes) {
        mapFormFields(getSignupState.value.data.ui.nodes);
      }
    } catch (error) {
      await oryErrorHandling(
        error as any,
        'signup',
        resetSignupFlow,
        'Failed to get signup data',
      );
    }
  });

  return {
    queryParams,
    queryFlow,
    title,
    isLoading,
    model,
    validation,
    schemaBackend,
    schemaFrontend,
    isDisabledButton,
    setSignupState,
    checkbox,
    onLogin,
    signupPasswordHandler,
    signupSocialHandler,
    demoAccountHandler,
    isDemoAccountAvailable: demoAccountAuth.isAvailable,
    isDemoAccountLoading: demoAccountAuth.isLoading,
    onMountedHandler,
    onValidate,
    isValid,
    mapFormFields,
    validateForm,
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
  import.meta.hot.accept(acceptHMRUpdate(useSignupStore, import.meta.hot));
}
