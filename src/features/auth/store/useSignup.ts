import {
  computed, nextTick, ref, toRaw,
} from 'vue';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import { urlSignin, urlProfile } from 'InvestCommon/global/links';
import { useRepositoryAuth } from 'InvestCommon/data/auth/auth.repository';
import { useFormValidation } from 'InvestCommon/composable/useFormValidation';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import {
  emailRule, errorMessageRule, passwordRule, firstNameRule, lastNameRule,
} from 'UiKit/helpers/validation/rules';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { SELFSERVICE } from './type';

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

  const {
    model, validation, isValid, onValidate,
  } = useFormValidation<FormModelSignUp>(schemaFrontend.value, schemaBackend.value, {} as FormModelSignUp);

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

  // Signup handlers
  const handleSignupSuccess = (session: any) => {
    const { submitFormToHubspot } = useHubspotForm(HUBSPOT_FORM_ID);
    if (model.email) {
      submitFormToHubspot({
        email: model.email,
        firstname: model.first_name,
        lastname: model.last_name,
      });
    }
    userSessionStore.updateSession(session);
    navigateToProfile();
  };

  const signupPasswordHandler = async () => {
    if (!checkbox.value) return;
    if (!validateForm()) return;

    isLoading.value = true;
    try {
      await authRepository.getAuthFlow(SELFSERVICE.registration);
      console.log('getAuthFlowState.value.error', getAuthFlowState.value.error);
      if (getAuthFlowState.value.error) return;

      await authRepository.setSignup(authRepository.flowId.value, {
        identifier: model.email,
        password: model.create_password,
        method: 'password',
        traits: {
          email: model.email,
          first_name: model.first_name,
          last_name: model.last_name,
        },
        csrf_token: authRepository.csrfToken.value,
      });

      if (setSignupState.value.error) return;

      if (setSignupState.value.data?.session) {
        handleSignupSuccess(setSignupState.value.data.session);
      }
    } catch (error) {
      console.error('Signup failed:', error);
    } finally {
      isLoading.value = false;
    }
  };

  const signupSocialHandler = async (provider: string) => {
    console.log('Social signup initiated for provider:', provider);
    isLoading.value = true;
    try {
      const currentFlowId = getQueryParam('flow');
      if (!currentFlowId) {
        await authRepository.getAuthFlow(SELFSERVICE.registration);
        if (getAuthFlowState.value.error) return;
      }

      await authRepository.setSignup(currentFlowId || authRepository.flowId.value, {
        csrf_token: authRepository.csrfToken.value,
        provider,
        method: 'oidc',
      });
    } catch (error) {
      console.error('Social signup failed:', error);
    } finally {
      isLoading.value = false;
    }
  };

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
          // eslint-disable-next-line prefer-destructuring
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
        await authRepository.getSignup(queryFlow.value);
      }

      if (getSignupState.value.data?.ui?.nodes) {
        mapFormFields(getSignupState.value.data.ui.nodes);
      }
    } catch (error) {
      console.error('Failed to initialize form data:', error);
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
    onMountedHandler,
    onValidate,
    isValid,
    mapFormFields,
    validateForm,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSignupStore, import.meta.hot));
}
