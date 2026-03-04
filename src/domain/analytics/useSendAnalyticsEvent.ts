
import { storeToRefs } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryAnalytics } from 'InvestCommon/data/analytics/analytics.repository';
import type { AnalyticsEventType, AnalyticsHttpMethod, IAnalyticsEventRequest } from 'InvestCommon/data/analytics/analytics.type';
import env from 'InvestCommon/config/env';
import { buildHttpRequest } from 'InvestCommon/domain/analytics/useAnalyticsError';

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
  /**
   * Where the user is in the app (UI route or logical location).
   * Example: '/onboarding/kyc'
   */
  request_path?: string;
  /**
   * What API endpoint was called.
   * Example: 'https://api.x.com/v1/kyc/submit'
   */
  httpRequestUrl?: string;
  /**
   * Optional correlation id; defaults to a UUID when omitted.
   */
  request_id?: string;
  /**
   * Override service name; normally rely on resolvedServiceName instead.
   */
  service_name?: string;
  version?: string;
}

export const useSendAnalyticsEvent = (options?: UseSendAnalyticsEventOptions) => {
  const isAnalyticsEnabled = env.ENABLE_ANALYTICS === '1';
  const userSessionStore = useSessionStore();
  const { userSession, userSessionTraits } = storeToRefs(userSessionStore);
  const analytics = useRepositoryAnalytics();

  const resolvedServiceName =
    options?.serviceName ?? (env.IS_STATIC_SITE === '1' ? 'vitepress-app' : 'vue3-app');

  const sendEvent = async (eventOptions: SendEventOptions): Promise<void> => {
    if (!isAnalyticsEnabled) {
      return;
    }

    const identityId = (userSession?.value?.identity?.id || '');
    const userEmail = userSessionTraits?.value?.email || '';
    const requestId = eventOptions.request_id || uuidv4();
    const requestPath = eventOptions.request_path || '';

    const httpLike = buildHttpRequest({
      method: eventOptions.httpRequestMethod || 'POST',
      // Prefer explicit API URL if provided; otherwise fall back to browser URL
      url: eventOptions.httpRequestUrl || undefined,
    });

    const eventData: IAnalyticsEventRequest = {
      event_type: eventOptions.event_type,
      method: eventOptions.method || 'GET',
      status_code: eventOptions.status_code || 200,
      identity_id: identityId,
      request_path: requestPath,
      service_context: {
        httpRequest: {
          method: (httpLike.method as AnalyticsHttpMethod) || (eventOptions.httpRequestMethod || 'POST'),
          url: httpLike.url,
          userAgent: httpLike.userAgent,
          referer: httpLike.referer,
          remoteIp: httpLike.remoteIp,
          protocol: httpLike.protocol,
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
