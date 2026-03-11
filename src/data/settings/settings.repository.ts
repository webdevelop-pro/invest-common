import { ApiClient } from 'InvestCommon/data/service/apiClient';
import env from 'InvestCommon/config/env';
import { ISession, IAuthFlow, ILogoutFlow } from './settings.types';
import { SessionFormatter } from './session.formatter';
import type { ISessionFormatted } from './settings.types';
import { createRepositoryStates, withActionState } from 'InvestCommon/data/repository/repository';
import { createFormatterCache } from 'InvestCommon/data/repository/formatterCache';
import { computed } from 'vue';
import { acceptHMRUpdate, defineStore } from 'pinia';

const { KRATOS_URL } = env;

type SettingsStates = {
  getAuthFlowState: IAuthFlow | ILogoutFlow;
  getSettingsState: IAuthFlow;
  setSettingsState: IAuthFlow;
  getAllSessionState: ISessionFormatted[];
  deleteAllSessionState: undefined;
  deleteOneSessionState: string;
};

export const useRepositorySettings = defineStore('repository-settings', () => {
  const apiClient = new ApiClient(KRATOS_URL);
  const sessionCache = createFormatterCache<ISession, ISessionFormatted, string>({
    getKey: (session) => session.id,
    getSignature: (session) => [
      session.authenticated_at,
      session.expires_at,
      session.active,
      session.devices?.length ?? 0,
      (session.devices ?? []).map((device) => `${device.id}:${device.ip_address}:${device.user_agent ?? ''}`).join(';'),
    ].join('|'),
    format: (session) => new SessionFormatter(session).format(),
  });

  const {
    getAuthFlowState,
    getSettingsState,
    setSettingsState,
    getAllSessionState,
    deleteAllSessionState,
    deleteOneSessionState,
    resetAll: resetActionStates,
  } = createRepositoryStates<SettingsStates>({
    getAuthFlowState: undefined,
    getSettingsState: undefined,
    setSettingsState: undefined,
    getAllSessionState: undefined,
    deleteAllSessionState: undefined,
    deleteOneSessionState: undefined,
  });

  const getAllSession = async () =>
    withActionState(getAllSessionState, async () => {
      const response = await apiClient.get('/sessions');
      const sessions = response.data as ISession[];
      sessionCache.prune(sessions);
      const formatted = sessionCache.formatMany(sessions);
      return formatted;
    });

  const deleteAllSession = async () =>
    withActionState(deleteAllSessionState, async () => {
      const response = await apiClient.delete('/sessions');
      return response.data;
    });

  const deleteOneSession = async (id: string) =>
    withActionState(deleteOneSessionState, async () => {
      const response = await apiClient.delete(`/sessions/${id}`, { type: 'text' });
      return response.data || 'Session deleted';
    });

  const getAuthFlow = async (url: string, query?: Record<string, string>) =>
    withActionState(getAuthFlowState, async () => {
      const response = await apiClient.get<IAuthFlow | ILogoutFlow>(url, { params: query });
      return response.data;
    });

  const setSettings = async (flowId: string, body: object) =>
    withActionState(setSettingsState, async () => {
      const response = await apiClient.post(`/self-service/settings?flow=${flowId}`, body);
      return response.data;
    });

  const getSettings = async (flowId: string) =>
    withActionState(getSettingsState, async () => {
      const response = await apiClient.get(`/self-service/settings/flows?id=${flowId}`);
      return response.data;
    });

  const flowId = computed(() => {
    const d = getAuthFlowState.value.data;
    return d && 'id' in d ? d.id : '';
  });

  const csrfToken = computed(() => {
    const res = getAuthFlowState.value.data && 'ui' in getAuthFlowState.value.data ? getAuthFlowState.value.data.ui : undefined;
    if (res) {
      const tokenItem = res.nodes.find((item: { attributes: { name: string; }; }) => (
        item.attributes.name === 'csrf_token'));
      return tokenItem?.attributes.value ?? '';
    }
    return '';
  });

  const resetAll = () => {
    sessionCache.clear();
    resetActionStates();
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
