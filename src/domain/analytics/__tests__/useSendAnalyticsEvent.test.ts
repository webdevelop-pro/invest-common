import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IAnalyticsEventRequest } from 'InvestCommon/data/analytics/analytics.type';

const trackEventMock = vi.fn();

vi.mock('pinia', () => ({
  storeToRefs: (store: unknown) => store,
}));

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: () => ({
    userSession: {
      value: {
        identity: {
          id: 'user-123',
          traits: { email: 'user@example.com' },
        },
      },
    },
    userSessionTraits: {
      value: {
        email: 'user@example.com',
      },
    },
  }),
}));

vi.mock('InvestCommon/data/analytics/analytics.repository', () => ({
  useRepositoryAnalytics: () => ({
    trackEvent: trackEventMock,
  }),
}));

vi.mock('InvestCommon/config/env', () => ({
  default: {
    IS_STATIC_SITE: '0',
    APP_VERSION: 'test-hash',
  },
}));

import { useSendAnalyticsEvent } from '../useSendAnalyticsEvent';

describe('useSendAnalyticsEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds analytics event payload with session and defaults', async () => {
    const { sendEvent } = useSendAnalyticsEvent();

    await sendEvent({
      // Cast as any to avoid depending on concrete enum values
      event_type: 'test_event' as any,
      request_path: '/test-path',
    });

    expect(trackEventMock).toHaveBeenCalledTimes(1);
    const payload = trackEventMock.mock.calls[0][0] as IAnalyticsEventRequest;

    expect(payload.event_type).toBe('test_event');
    expect(payload.method).toBe('GET');
    expect(payload.status_code).toBe(200);
    expect(payload.identity_id).toBe('user-123');
    expect(payload.request_path).toBe('/test-path');

    expect(payload.service_context.httpRequest.method).toBe('POST');
    expect(payload.service_context.httpRequest.url).toBe('/test-path');

    expect(payload.service_context.user).toBe('user@example.com');
    expect(payload.service_context.request_id).toBeTruthy();
    expect(payload.service_context.service_name).toBe('vue3-app');
    expect(payload.service_context.version).toBe('test-hash');
  });

  it('does not throw when analytics client rejects', async () => {
    trackEventMock.mockRejectedValueOnce(new Error('Failed to send'));

    const { sendEvent } = useSendAnalyticsEvent();

    await sendEvent({
      event_type: 'test_event' as any,
      request_path: '/error-path',
    });

    expect(trackEventMock).toHaveBeenCalledTimes(1);
  });
});

