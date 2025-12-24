import { ApiClient } from 'InvestCommon/data/service/apiClient';
import { createActionState } from 'InvestCommon/data/repository/repository';
import env from 'InvestCommon/domain/config/env';
import { IAnalyticsEventRequest, IAnalyticsMessage, IAnalyticsResponse } from './analytics.type';

const { ANALYTIC_URL } = env;

export const useRepositoryAnalytics = () => {
  const apiClient = new ApiClient(ANALYTIC_URL);

  const setMessageState = createActionState<IAnalyticsResponse>();
  const setEventState = createActionState<IAnalyticsResponse>();

  const setMessage = async (messageData: IAnalyticsMessage): Promise<IAnalyticsResponse> => {
    try {
      setMessageState.value.loading = true;
      setMessageState.value.error = null;

      const payload = {
        ...messageData,
        time: messageData.time || new Date().toISOString(),
      };

      const response = await apiClient.post<IAnalyticsResponse>('/public/log', payload);
      setMessageState.value.data = response.data;
      return response.data;
    } catch (err) {
      setMessageState.value.error = err as Error;
      setMessageState.value.data = undefined;
      console.error('Analytics setMessage error:', err);
      throw err;
    } finally {
      setMessageState.value.loading = false;
    }
  };

  const sendEvent = async (eventData: IAnalyticsEventRequest): Promise<IAnalyticsResponse> => {
    try {
      setEventState.value.loading = true;
      setEventState.value.error = null;

      const response = await apiClient.post<IAnalyticsResponse>('/public/event', eventData);
      setEventState.value.data = response.data;
      return response.data;
    } catch (err) {
      setEventState.value.error = err as Error;
      setEventState.value.data = undefined;
      throw err;
    } finally {
      setEventState.value.loading = false;
    }
  };

  const resetAll = () => {
    setMessageState.value.data = undefined;
    setMessageState.value.loading = false;
    setMessageState.value.error = null;
    setEventState.value.data = undefined;
    setEventState.value.loading = false;
    setEventState.value.error = null;
  };

  return {
    // States
    setMessageState: setMessageState.value,
    setEventState: setEventState.value,

    // Actions
    setMessage,
    sendEvent,
    resetAll,
  };
};
