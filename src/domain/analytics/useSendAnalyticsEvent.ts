
import { storeToRefs } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryAnalytics } from 'InvestCommon/data/analytics/analytics.repository';
import type { AnalyticsEventType, AnalyticsHttpMethod, IAnalyticsEventRequest } from 'InvestCommon/data/analytics/analytics.type';
import env from 'InvestCommon/config/env';

export interface UseSendAnalyticsEventOptions {
  /**
   * Logical name of the frontend application emitting events.
   * Example: 'vue3-app', 'vitepress-app'.
   */
  serviceName: string;
}

export interface SendEventOptions {
  event_type: AnalyticsEventType;
  method?: AnalyticsHttpMethod;
  httpRequestMethod?: AnalyticsHttpMethod;
  status_code?: number;
  request_path?: string;
  service_name?: string;
  version?: string;
}

/**
 * Composable for sending analytics events
 * Handles common event payload construction and error handling
 */
export const useSendAnalyticsEvent = (options?: UseSendAnalyticsEventOptions) => {
  const userSessionStore = useSessionStore();
  const { userSession, userSessionTraits } = storeToRefs(userSessionStore);
  const analytics = useRepositoryAnalytics();

  const resolvedServiceName =
    options?.serviceName ?? (env.IS_STATIC_SITE === '1' ? 'vitepress-app' : 'vue3-app');

  /**
   * Sends an analytics event with automatically populated common fields
   * @param options - Event options (event_type is required, others are optional)
   * @returns Promise that resolves when the event is sent
   */
  const sendEvent = async (eventOptions: SendEventOptions): Promise<void> => {

    const identityId = (userSession?.value?.identity?.id || '');
    const userEmail = userSessionTraits?.value?.email || '';
    const requestId = uuidv4();
    const requestPath = eventOptions.request_path || '';
    const protocol = typeof window !== 'undefined' ? window.location.protocol.replace(':', '') : '';
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const referer = typeof document !== 'undefined' ? document.referrer || '' : '';

    const eventData: IAnalyticsEventRequest = {
      event_type: eventOptions.event_type,
      method: eventOptions.method || 'GET',
      status_code: eventOptions.status_code || 200,
      identity_id: identityId,
      request_path: requestPath,
      service_context: {
        httpRequest: {
          method: eventOptions.httpRequestMethod || 'POST',
          url: requestPath,
          userAgent,
          referer,
          remoteIp: '-',
          protocol,
        },
        user: userEmail,
        request_id: requestId,
        service_name: eventOptions.service_name || resolvedServiceName,
        version: eventOptions.version || env.APP_VERSION || 'unknown',
      },
    };

    try {
      await analytics.trackEvent(eventData);
    } catch (error) {
      console.error('Failed to send analytics event', error);
      // Don't throw - analytics failures shouldn't break the app
    }
  };

  return {
    sendEvent,
  };
};
