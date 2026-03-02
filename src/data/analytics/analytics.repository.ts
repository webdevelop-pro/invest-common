import { ApiClient } from 'InvestCommon/data/service/apiClient';
import { createActionState, withActionState } from 'InvestCommon/data/repository/repository';
import env from 'InvestCommon/domain/config/env';
import { IAnalyticsEventRequest, IAnalyticsMessage, IAnalyticsResponse } from './analytics.type';

const { ANALYTIC_URL } = env;

export const useRepositoryAnalytics = () => {
  const apiClient = new ApiClient(ANALYTIC_URL);

  const setMessageState = createActionState<IAnalyticsResponse>();
  const setEventState = createActionState<IAnalyticsResponse>();

  const setMessage = async (messageData: IAnalyticsMessage): Promise<IAnalyticsResponse> => {
    try {
      return await withActionState(setMessageState, async () => {
        const payload = {
          ...messageData,
          time: messageData.time || new Date().toISOString(),
        };
        const response = await apiClient.post<IAnalyticsResponse>('/public/log', payload, {
          showGlobalAlertOnServerError: false,
        });
        return response.data ?? ({} as IAnalyticsResponse);
      });
    } catch (err) {
      console.error('Analytics setMessage error:', err);
      throw err;
    }
  };

  const sendEvent = async (eventData: IAnalyticsEventRequest): Promise<IAnalyticsResponse> =>
    withActionState(setEventState, async () => {
      const response = await apiClient.post<IAnalyticsResponse>('/public/event', eventData, {
        showGlobalAlertOnServerError: false,
      });
      return response.data ?? ({} as IAnalyticsResponse);
    });

  const resetAll = () => {
    setMessageState.value = { loading: false, error: null, data: undefined };
    setEventState.value = { loading: false, error: null, data: undefined };
  };

  return {
    // States (expose refs so consumers stay reactive)
    setMessageState,
    setEventState,

    // Actions
    setMessage,
    sendEvent,
    resetAll,
  };
};
