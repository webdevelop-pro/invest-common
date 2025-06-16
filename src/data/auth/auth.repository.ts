import { ApiClient } from 'InvestCommon/data/service/apiClient';
import { oryErrorHandling } from 'InvestCommon/data/repository/error/oryErrorHandling';
import { toasterErrorHandling } from 'InvestCommon/data/repository/error/toasterErrorHandling';
import env from 'InvestCommon/global';
import { SELFSERVICE } from 'InvestCommon/features/auth/store/type';
import { createActionState } from 'InvestCommon/data/repository/repository';
import { computed } from 'vue';
import {
  ISession, IAuthFlow, ILogoutFlow, ISchema, ISuccessfullNativeAuth,
} from './auth.type';

const { KRATOS_URL } = env;

// https://github.com/ory/kratos-selfservice-ui-react-nextjs/blob/master/pages/login.tsx

export const useRepositoryAuth = () => {
  const apiClient = new ApiClient(KRATOS_URL);

  // Create action states for each function
  const getSessionState = createActionState<ISession>();
  const getAuthFlowState = createActionState<ILogoutFlow>();
  const getSchemaState = createActionState<ISchema>();

  const getLogoutState = createActionState<undefined>();

  const setRecoveryState = createActionState<IAuthFlow>();

  const getLoginState = createActionState<IAuthFlow>();
  const setLoginState = createActionState<ISuccessfullNativeAuth>();

  const getSignupState = createActionState<IAuthFlow>();
  const setSignupState = createActionState<ISuccessfullNativeAuth>();

  const getSession = async () => {
    try {
      getSessionState.value.loading = true;
      getSessionState.value.error = null;
      const response = await apiClient.get('/sessions/whoami');
      getSessionState.value.data = response.data;
      return response.data;
    } catch (err) {
      getSessionState.value.error = err as Error;
      if (err?.data?.responseJson?.error?.code !== 401) {
        oryErrorHandling(err, 'session', () => {}, 'Failed to get session');
        throw err;
      }
    } finally {
      getSessionState.value.loading = false;
    }
  };

  const getAuthFlow = async (url: string, query?: Record<string, string>) => {
    try {
      getAuthFlowState.value.loading = true;
      getAuthFlowState.value.error = null;
      const response = await apiClient.get(url, { params: query });
      getAuthFlowState.value.data = response.data;
      return response.data;
    } catch (err) {
      getAuthFlowState.value.error = err as Error;
      oryErrorHandling(err, 'browser', () => {}, 'Failed to get auth flow');
      throw err;
    } finally {
      getAuthFlowState.value.loading = false;
    }
  };

  const setLogin = async (flowId: string, body: object) => {
    try {
      setLoginState.value.loading = true;
      setLoginState.value.error = null;
      const response = await apiClient.post(`/self-service/login?flow=${flowId}`, body);
      setLoginState.value.data = response.data;
      return response.data;
    } catch (err) {
      setLoginState.value.error = err as Error;
      oryErrorHandling(err, 'login', getAuthFlow(SELFSERVICE.login), 'Failed to login');
      throw err;
    } finally {
      setLoginState.value.loading = false;
    }
  };

  const getLogin = async (flowId: string) => {
    try {
      getLoginState.value.loading = true;
      getLoginState.value.error = null;
      const response = await apiClient.get(`/self-service/login/flows?id=${flowId}`);
      getLoginState.value.data = response.data;
      console.log('getLogin response:', response.data);
      return response.data;
    } catch (err) {
      getLoginState.value.error = err as Error;
      oryErrorHandling(err, 'login', getAuthFlow(SELFSERVICE.login), 'Failed to get login data');
      throw err;
    } finally {
      getLoginState.value.loading = false;
    }
  };

  const getLogout = async (token: string) => {
    try {
      getLogoutState.value.loading = true;
      getLogoutState.value.error = null;
      const response = await apiClient.get(`/self-service/logout?token=${token}`);
      return response;
    } catch (err) {
      getLogoutState.value.error = err as Error;
      oryErrorHandling(err, 'logout', getAuthFlow(SELFSERVICE.logout), 'Failed to logout');
      throw err;
    } finally {
      getLogoutState.value.loading = false;
    }
  };

  const getSignup = async (flowId: string) => {
    try {
      getSignupState.value.loading = true;
      getSignupState.value.error = null;
      const response = await apiClient.get(`/self-service/registration/flows?id=${flowId}`);
      getSignupState.value.data = response.data;
      return response.data;
    } catch (err) {
      getSignupState.value.error = err as Error;
      oryErrorHandling(err, 'signup', getAuthFlow(SELFSERVICE.registration), 'Failed to get signup data');
      throw err;
    } finally {
      getSignupState.value.loading = false;
    }
  };

  const setSignup = async (flowId: string, body: object) => {
    try {
      setSignupState.value.loading = true;
      setSignupState.value.error = null;
      const response = await apiClient.post(`/self-service/registration?flow=${flowId}`, body);
      setSignupState.value.data = response.data;
      return response.data;
    } catch (err) {
      setSignupState.value.error = err as Error;
      oryErrorHandling(err, 'signup', getAuthFlow(SELFSERVICE.registration), 'Failed to signup');
      throw err;
    } finally {
      setSignupState.value.loading = false;
    }
  };

  const setRecovery = async (flowId: string, body: object) => {
    try {
      setRecoveryState.value.loading = true;
      setRecoveryState.value.error = null;
      const response = await apiClient.post(`/self-service/recovery?flow=${flowId}`, body);
      setRecoveryState.value.data = response.data;
      return response.data;
    } catch (err) {
      setRecoveryState.value.error = err as Error;
      oryErrorHandling(err, 'recovery', getAuthFlow(SELFSERVICE.recovery), 'Failed to set recovery');
      throw err;
    } finally {
      setRecoveryState.value.loading = false;
    }
  };

  const getSchema = async () => {
    try {
      getSchemaState.value.loading = true;
      getSchemaState.value.error = null;
      const response = await apiClient.get('/schemas');
      getSchemaState.value.data = response.data;
      return response.data;
    } catch (err) {
      getSchemaState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to get schema');
      throw err;
    } finally {
      getSchemaState.value.loading = false;
    }
  };

  const flowId = computed(() => getAuthFlowState.value.data?.id || '');

  const csrfToken = computed(() => {
    // const res = getSignupData.value?.ui || getAuthFlowState.value.data.ui;
    const res = getAuthFlowState.value.data.ui;
    if (res) {
      const tokenItem = res.nodes.find((item: { attributes: { name: string; }; }) => (
        item.attributes.name === 'csrf_token'));
      return tokenItem?.attributes.value ?? '';
    }
    return '';
  });

  const resetAll = () => {
    getSessionState.value = { loading: false, error: null, data: null };
    getAuthFlowState.value = { loading: false, error: null, data: null };
    setRecoveryState.value = { loading: false, error: null, data: null };
    setLoginState.value = { loading: false, error: null, data: null };
    setSignupState.value = { loading: false, error: null, data: null };
    getSignupState.value = { loading: false, error: null, data: null };
    getSchemaState.value = { loading: false, error: null, data: null };
    getLoginState.value = { loading: false, error: null, data: null };
    getLogoutState.value = { loading: false, error: null, data: null };
  };

  return {
    // States
    getSessionState,
    getAuthFlowState,
    setRecoveryState,
    setLoginState,
    setSignupState,
    getSignupState,
    getSchemaState,
    getLoginState,
    getLogoutState,
    flowId,
    csrfToken,

    // Functions
    getSession,
    getAuthFlow,
    setLogin,
    getLogin,
    getLogout,
    setSignup,
    setRecovery,
    getSignup,
    getSchema,
    resetAll,
  };
};
