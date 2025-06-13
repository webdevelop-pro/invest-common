import {
  computed, nextTick, ref, toRaw,
} from 'vue';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import { urlSignup, urlProfile } from 'InvestCommon/global/links';
import { useRepositoryAuth } from 'InvestCommon/data/auth/auth.repository';
import { useFormValidation } from 'InvestCommon/composable/useFormValidation';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { emailRule, errorMessageRule, passwordRule } from 'UiKit/helpers/validation/rules';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import { useUserSession } from 'InvestCommon/store/useUserSession';
import { SELFSERVICE } from './type';
import { useDialogs } from 'InvestCommon/domain/dialogs/store/useDialogs';

type FormModelSignIn = {
  email: string;
  password: string;
}

const HUBSPOT_FORM_ID = '07463465-7f03-42d2-a85e-40cf8e29969d';

export const useLoginRefreshStore = defineStore('loginRefresh', () => {
  const authRepository = useRepositoryAuth();
  const { getSchemaState, setLoginState, getAuthFlowState } = storeToRefs(authRepository);
  const userSessionStore = useUserSession();
const useDialogsStore = useDialogs();
const { isDialogRefreshSessionOpen } = storeToRefs(useDialogsStore);

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

  const schemaBackend = computed(() => (getSchemaState.value.data ? structuredClone(toRaw(getSchemaState.value.data)) : null));

  const {
    model, validation, isValid, onValidate,
  } = useFormValidation<FormModelSignIn>(schemaFrontend.value, schemaBackend.value, {} as FormModelSignIn);

  const isLoading = ref(false);
  const isDisabledButton = computed(() => !isValid.value || isLoading.value);

  // Form validation
  const validateForm = () => {
    onValidate();
    if (!isValid.value) {
      nextTick(() => scrollToError('VFormAuthLogInRefresh'));
      return false;
    }
    return true;
  };

  const loginPasswordHandler = async () => {
    if (!validateForm()) return;

    isLoading.value = true;
    try {
      await authRepository.getAuthFlow(SELFSERVICE.login, { refresh: true });
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
        userSessionStore.updateSession(setLoginState.value.data.session);
        isDialogRefreshSessionOpen.value = false;
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
      if (!flowId) {
        await authRepository.getAuthFlow(SELFSERVICE.login, { refresh: true });
        if (getAuthFlowState.value.error) return;
      }

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

  return {
    queryParams,
    isLoading,
    model,
    validation,
    schemaBackend,
    schemaFrontend,
    isDisabledButton,
    setLoginState,
    loginPasswordHandler,
    loginSocialHandler,
    onValidate,
    isValid,
    getQueryParam,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useLoginRefreshStore, import.meta.hot));
}
