import { ApiClient } from 'InvestCommon/data/service/apiClient';
import { toasterErrorHandlingAnalytics } from 'UiKit/helpers/api/toasterErrorHandlingAnalytics';
import env from 'InvestCommon/global';
import { createActionState } from 'UiKit/helpers/api/repository';
import {
  ISession, IAuthFlow, ILogoutFlow,
} from './auth.type';

const { AUTH_URL } = env;

// https://github.com/ory/kratos-selfservice-ui-react-nextjs/blob/master/pages/login.tsx

export const useRepositoryAuth = () => {
  const apiClient = new ApiClient(AUTH_URL);

  // Create action states for each function
  const getAuthFlowState = createActionState<ILogoutFlow>();

  const getSettingsState = createActionState<IAuthFlow>();
  const setSettingsState = createActionState<IAuthFlow>();
  const getAllSessionState = createActionState<ISession[]>();
  const deleteAllSessionState = createActionState<undefined>();
  const deleteOneSessionState = createActionState<undefined>();

  const getAllSession = async () => {
    try {
      getAllSessionState.value.loading = true;
      getAllSessionState.value.error = null;
      const response = await apiClient.get('/sessions');
      getAllSessionState.value.data = response.data;
      return response.data;
    } catch (err) {
      getAllSessionState.value.error = err as Error;
      toasterErrorHandlingAnalytics(err, 'Failed to get all sessions');
      throw err;
    } finally {
      getAllSessionState.value.loading = false;
    }
  };

  const deleteAllSession = async () => {
    try {
      deleteAllSessionState.value.loading = true;
      deleteAllSessionState.value.error = null;
      const response = await apiClient.delete('/sessions');
      deleteAllSessionState.value.data = response.data;
      return response.data;
    } catch (err) {
      deleteAllSessionState.value.error = err as Error;
      toasterErrorHandlingAnalytics(err, 'Failed to delete all sessions');
      throw err;
    } finally {
      deleteAllSessionState.value.loading = false;
    }
  };

  const deleteOneSession = async (id: string) => {
    try {
      deleteOneSessionState.value.loading = true;
      deleteOneSessionState.value.error = null;
      const response = await apiClient.delete(`/sessions/${id}`);
      deleteOneSessionState.value.data = response.data;
      return response.data;
    } catch (err) {
      deleteOneSessionState.value.error = err as Error;
      toasterErrorHandlingAnalytics(err, 'Failed to delete session');
      throw err;
    } finally {
      deleteOneSessionState.value.loading = false;
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
      toasterErrorHandlingAnalytics(err, 'Failed to get auth flow');
      throw err;
    } finally {
      getAuthFlowState.value.loading = false;
    }
  };

  const setSettings = async (flowId: string, data: any, csrf_token: string) => {
    try {
      setSettingsState.value.loading = true;
      setSettingsState.value.error = null;
      const response = await apiClient.post(`/self-service/settings?flow=${flowId}`, {
        ...data,
        csrf_token,
      });
      setSettingsState.value.data = response.data;
      return response.data;
    } catch (err) {
      setSettingsState.value.error = err as Error;
      toasterErrorHandlingAnalytics(err, 'Failed to set settings');
      throw err;
    } finally {
      setSettingsState.value.loading = false;
    }
  };

  const getSettings = async (flowId: string) => {
    try {
      getSettingsState.value.loading = true;
      getSettingsState.value.error = null;
      const response = await apiClient.get(`/self-service/settings/flows?id=${flowId}`);
      getSettingsState.value.data = response.data;
      return response.data;
    } catch (err) {
      getSettingsState.value.error = err as Error;
      toasterErrorHandlingAnalytics(err, 'Failed to get settings');
      throw err;
    } finally {
      getSettingsState.value.loading = false;
    }
  };

  return {
    // States
    getAuthFlowState,
    getSettingsState,
    setSettingsState,
    getAllSessionState,
    deleteAllSessionState,
    deleteOneSessionState,

    // Functions
    getAllSession,
    deleteAllSession,
    deleteOneSession,
    getAuthFlow,
    setSettings,
    getSettings,
  };
};
