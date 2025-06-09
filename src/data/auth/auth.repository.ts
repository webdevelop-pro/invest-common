import { ApiClient } from 'UiKit/helpers/api/apiClient';
import { toasterErrorHandling } from 'UiKit/helpers/api/toasterErrorHandling';
import env from 'InvestCommon/global';
import { createActionState } from 'UiKit/helpers/api/repository';
import {
  ISession, IAuthFlow, ILogoutFlow, ISchema, ISuccessfullNativeAuth,
} from './auth.type';

const { AUTH_URL } = env;

// https://github.com/ory/kratos-selfservice-ui-react-nextjs/blob/master/pages/login.tsx

export const useRepositoryAuth = () => {
  const apiClient = new ApiClient(AUTH_URL);

  // Create action states for each function
  const getSessionState = createActionState<ISession>();
  const getAuthFlowState = createActionState<ILogoutFlow>();
  const getSchemaState = createActionState<ISchema>();

  const getLogoutURLState = createActionState<ILogoutFlow>();
  const getLogoutState = createActionState<undefined>();

  const setRecoveryState = createActionState<IAuthFlow>();

  const getLoginState = createActionState<IAuthFlow>();
  const setLoginState = createActionState<ISuccessfullNativeAuth>();

  const getSignupState = createActionState<IAuthFlow>();
  const setSignupState = createActionState<ISuccessfullNativeAuth>();

  const setSocialLoginState = createActionState<ISuccessfullNativeAuth>();
  const setSocialSignupState = createActionState<ISuccessfullNativeAuth>();

  const setVerificationState = createActionState<IAuthFlow>();

  const getSession = async () => {
    try {
      getSessionState.value.loading = true;
      getSessionState.value.error = null;
      const response = await apiClient.get('/sessions/whoami');
      getSessionState.value.data = response.data;
      return response.data;
    } catch (err) {
      getSessionState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to get session');
      throw err;
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
      toasterErrorHandling(err, 'Failed to get auth flow');
      throw err;
    } finally {
      getAuthFlowState.value.loading = false;
    }
  };

  const setLogin = async (flowId: string, body: string) => {
    try {
      setLoginState.value.loading = true;
      setLoginState.value.error = null;
      const response = await apiClient.post(`/self-service/login?flow=${flowId}`, body);
      setLoginState.value.data = response.data;
      return response.data;
    } catch (err) {
      setLoginState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to login');
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
      return response.data;
    } catch (err) {
      getLoginState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to get login data');
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
      toasterErrorHandling(err, 'Failed to logout');
      throw err;
    } finally {
      getLogoutState.value.loading = false;
    }
  };

  const getLogoutURL = async () => {
    try {
      getLogoutURLState.value.loading = true;
      getLogoutURLState.value.error = null;
      const response = await apiClient.get('/self-service/logout/browser');
      getLogoutURLState.value.data = response.data;
      return response.data;
    } catch (err) {
      getLogoutURLState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to get logout URL');
      throw err;
    } finally {
      getLogoutURLState.value.loading = false;
    }
  };

  const setSignup = async (flowId: string, password: string, firstName: string, lastName: string, email: string, csrf_token: string) => {
    try {
      setSignupState.value.loading = true;
      setSignupState.value.error = null;
      const response = await apiClient.post(`/self-service/registration?flow=${flowId}`, {
        password,
        traits: {
          email,
          name: {
            first: firstName,
            last: lastName,
          },
        },
        csrf_token,
      });
      setSignupState.value.data = response.data;
      return response.data;
    } catch (err) {
      setSignupState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to signup');
      throw err;
    } finally {
      setSignupState.value.loading = false;
    }
  };

  const setRecovery = async (flowId: string, email: string, csrf_token: string) => {
    try {
      setRecoveryState.value.loading = true;
      setRecoveryState.value.error = null;
      const response = await apiClient.post(`/self-service/recovery?flow=${flowId}`, {
        email,
        csrf_token,
      });
      setRecoveryState.value.data = response.data;
      return response.data;
    } catch (err) {
      setRecoveryState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to set recovery');
      throw err;
    } finally {
      setRecoveryState.value.loading = false;
    }
  };

  const setVerification = async (flowId: string, code: string, csrf_token: string) => {
    try {
      setVerificationState.value.loading = true;
      setVerificationState.value.error = null;
      const response = await apiClient.post(`/self-service/verification?flow=${flowId}`, {
        code,
        csrf_token,
      });
      setVerificationState.value.data = response.data;
      return response.data;
    } catch (err) {
      setVerificationState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to verify');
      throw err;
    } finally {
      setVerificationState.value.loading = false;
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
      toasterErrorHandling(err, 'Failed to get signup data');
      throw err;
    } finally {
      getSignupState.value.loading = false;
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

  return {
    // States
    getSessionState,
    getAuthFlowState,
    getLogoutURLState,
    setRecoveryState,
    setLoginState,
    setSignupState,
    getSignupState,
    getSchemaState,
    setSocialLoginState,
    setSocialSignupState,
    setVerificationState,
    getLoginState,
    getLogoutState,

    // Functions
    getSession,
    getAuthFlow,
    setLogin,
    getLogin,
    getLogout,
    getLogoutURL,
    setSignup,
    setRecovery,
    setVerification,
    getSignup,
    getSchema,
  };
};
