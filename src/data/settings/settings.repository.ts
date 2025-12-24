import { ApiClient } from 'InvestCommon/data/service/apiClient';
import env from 'InvestCommon/domain/config/env';
import { ISession, IAuthFlow, ILogoutFlow } from './settings.types';
import { SessionFormatter } from './session.formatter';
import type { ISessionFormatted } from './settings.types';
import { createActionState } from 'InvestCommon/data/repository/repository';
import { oryErrorHandling } from 'InvestCommon/data/repository/error/oryErrorHandling';
import { computed } from 'vue';
import { acceptHMRUpdate, defineStore } from 'pinia';

const { KRATOS_URL } = env;

export const useRepositorySettings = defineStore('repository-settings', () => {
  const apiClient = new ApiClient(KRATOS_URL);

  // Create action states for each function
  const getAuthFlowState = createActionState<ILogoutFlow>();

  const getSettingsState = createActionState<IAuthFlow>();
  const setSettingsState = createActionState<IAuthFlow>();
  const getAllSessionState = createActionState<ISessionFormatted[]>();
  const deleteAllSessionState = createActionState<undefined>();
  const deleteOneSessionState = createActionState<string>();

  const getAllSession = async () => {
    try {
      getAllSessionState.value.loading = true;
      getAllSessionState.value.error = null;
      const response = await apiClient.get('/sessions');
      const formatted = (response.data as ISession[]).map((s) => new SessionFormatter(s).format());
      getAllSessionState.value.data = formatted;
      return formatted;
    } catch (err) {
      getAllSessionState.value.error = err as Error;
      getAllSessionState.value.data = undefined;
      oryErrorHandling(err, 'session', () => {}, 'Failed to get all sessions');
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
      deleteAllSessionState.value.data = undefined;
      oryErrorHandling(err, 'session', () => {}, 'Failed to delete all sessions');
      throw err;
    } finally {
      deleteAllSessionState.value.loading = false;
    }
  };

  const deleteOneSession = async (id: string) => {
    try {
      deleteOneSessionState.value.loading = true;
      deleteOneSessionState.value.error = null;
      const response = await apiClient.delete(`/sessions/${id}`, { type: 'text' });
      const result = response.data || 'Session deleted';
      deleteOneSessionState.value.data = result;
      return result;
    } catch (err) {
      deleteOneSessionState.value.error = err as Error;
      deleteOneSessionState.value.data = undefined;
      oryErrorHandling(err, 'session', () => {}, 'Failed to delete session');
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
      return response;
    } catch (err) {
      getAuthFlowState.value.error = err as Error;
      getAuthFlowState.value.data = undefined;
      oryErrorHandling(err, 'session', () => {}, 'Failed to get auth flow');
      throw err;
    } finally {
      getAuthFlowState.value.loading = false;
    }
  };

  const setSettings = async (flowId: string, body: object, callback: () => void) => {
    try {
      setSettingsState.value.loading = true;
      setSettingsState.value.error = null;
      const response = await apiClient.post(`/self-service/settings?flow=${flowId}`, body);
      setSettingsState.value.data = response.data;
      return response.data;
    } catch (err) {
      setSettingsState.value.error = err as Error;
      setSettingsState.value.data = undefined;
      await oryErrorHandling(
        err, 
        'session', 
        () => getAuthFlow('/self-service/settings/browser'),
        'Failed to set settings',
        callback,
      );
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
      getSettingsState.value.data = undefined;
      oryErrorHandling(err, 'session', () => {}, 'Failed to get settings');
      throw err;
    } finally {
      getSettingsState.value.loading = false;
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
    getAuthFlowState.value = { loading: false, error: null, data: undefined };
    getSettingsState.value = { loading: false, error: null, data: undefined };
    setSettingsState.value = { loading: false, error: null, data: undefined };
    getAllSessionState.value = { loading: false, error: null, data: undefined };
    deleteAllSessionState.value = { loading: false, error: null, data: undefined };
    deleteOneSessionState.value = { loading: false, error: null, data: undefined };
  };

  return {
    // States
    getAuthFlowState,
    getSettingsState,
    setSettingsState,
    getAllSessionState,
    deleteAllSessionState,
    deleteOneSessionState,
    flowId,
    csrfToken,

    // Functions
    getAllSession,
    deleteAllSession,
    deleteOneSession,
    getAuthFlow,
    setSettings,
    getSettings,
    resetAll,
  };
});


if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRepositorySettings, import.meta.hot));
}

