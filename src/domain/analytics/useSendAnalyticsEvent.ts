
import { storeToRefs } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryAnalytics } from 'InvestCommon/data/analytics/analytics.repository';
import type { AnalyticsEventType, AnalyticsHttpMethod, IAnalyticsEventRequest } from 'InvestCommon/data/analytics/analytics.type';
import env from 'InvestCommon/domain/config/env';

// Controlled via VITE_ENABLE_ANALYTICS env variable
// Example:
//   VITE_ENABLE_ANALYTICS=1  -> events are sent
//   VITE_ENABLE_ANALYTICS=0 -> events are skipped (recommended for local)
const isAnalyticsEnabled = env.ENABLE_ANALYTICS === '1';

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
export const useSendAnalyticsEvent = () => {
  const userSessionStore = useSessionStore();
  const { userSession, userSessionTraits } = storeToRefs(userSessionStore);
  const analytics = useRepositoryAnalytics();

  /**
   * Sends an analytics event with automatically populated common fields
   * @param options - Event options (event_type is required, others are optional)
   * @returns Promise that resolves when the event is sent
   */
  const sendEvent = async (options: SendEventOptions): Promise<void> => {
    // Don't send analytics when disabled via env (e.g. local development)
    if (!isAnalyticsEnabled) {
      return;
    }

    const identityId = (userSession?.value?.identity?.id || '');
    const userEmail = userSessionTraits?.value?.email || '';
    const requestId = uuidv4();
    const requestPath = options.request_path || '';
    const protocol = typeof window !== 'undefined' ? window.location.protocol.replace(':', '') : '';
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const referer = typeof document !== 'undefined' ? document.referrer || '' : '';

    const eventData: IAnalyticsEventRequest = {
      event_type: options.event_type,
      method: options.method || 'GET',
      status_code: options.status_code || 200,
      identity_id: identityId,
      request_path: requestPath,
      service_context: {
        httpRequest: {
          method: options.httpRequestMethod || 'POST',
          url: requestPath,
          userAgent,
          referer,
          remoteIp: '-',
          protocol,
        },
        user: userEmail,
        request_id: requestId,
        service_name: options.service_name || 'vitepress-app',
        version: options.version || import.meta.env.VITE_GIT_HASH || 'unknown',
      },
    };

    try {
      await analytics.sendEvent(eventData);
    } catch (error) {
      console.error('Failed to send analytics event', error);
      // Don't throw - analytics failures shouldn't break the app
    }
  };

  return {
    sendEvent,
  };
};
