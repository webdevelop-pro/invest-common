import { ApiClient } from 'InvestCommon/data/service/apiClient';
import { createActionState } from 'InvestCommon/data/repository/repository';
import env from 'InvestCommon/domain/config/env';
import { IAnalyticsMessage, IAnalyticsResponse } from './analytics.type';

const { ANALYTIC_URL } = env;

export const useRepositoryAnalytics = () => {
  const apiClient = new ApiClient(ANALYTIC_URL);

  const setMessageState = createActionState<IAnalyticsResponse>();

  const setMessage = async (messageData: IAnalyticsMessage): Promise<IAnalyticsResponse> => {
    try {
      setMessageState.value.loading = true;
      setMessageState.value.error = null;

      const payload = {
        ...messageData,
        time: messageData.time || new Date().toISOString(),
      };

      // const response = await apiClient.post<IAnalyticsResponse>('/public/log', payload);
      setMessageState.value.data = response.data;
      return response.data;
    } catch (err) {
      setMessageState.value.error = err as Error;
      console.error('Analytics setMessage error:', err);
      throw err;
    } finally {
      setMessageState.value.loading = false;
    }
  };

  const resetAll = () => {
    setMessageState.value.data = undefined;
    setMessageState.value.loading = false;
    setMessageState.value.error = null;
  };

  return {
    // States
    setMessageState: setMessageState.value,

    // Actions
    setMessage,
    resetAll,
  };
};
