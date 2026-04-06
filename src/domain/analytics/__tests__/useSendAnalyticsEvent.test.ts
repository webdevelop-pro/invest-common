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
    ENABLE_ANALYTICS: '1',
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
      event_type: 'open',
      request_path: '/test-path',
      httpRequestUrl: 'https://api.test.local/v1/example',
      body: {
        email: 'user@example.com',
        first_name: 'Jamie',
        city: 'Kyiv',
        state: 'CA',
        zip_code: '90210',
        country: 'US',
        nested: {
          accepted: true,
          routing_number: '021000021',
        },
      },
    });

    expect(trackEventMock).toHaveBeenCalledTimes(1);
    const payload = trackEventMock.mock.calls[0][0] as IAnalyticsEventRequest;

    expect(payload.event_type).toBe('open');
    expect(payload.method).toBe('GET');
    expect(payload.status_code).toBe(200);
    expect(payload.identity_id).toBe('user-123');
    expect(payload.request_path).toBe('/test-path');
    expect(payload.body).toEqual({
      email: 'user@example.com',
      first_name: '[redacted]',
      city: '[redacted]',
      state: '[redacted]',
      zip_code: '[redacted]',
      country: '[redacted]',
      nested: {
        accepted: true,
        routing_number: '[redacted]',
      },
    });

    expect(payload.service_context.httpRequest.method).toBe('POST');
    expect(payload.service_context.httpRequest.url).toBe('https://api.test.local/v1/example');

    expect(payload.service_context.user).toBe('user@example.com');
    expect(payload.service_context.request_id).toBeTruthy();
    expect(payload.service_context.service_name).toBe('vue3-app');
    expect(payload.service_context.version).toBe('test-hash');
  });

  it('does not throw when analytics client rejects', async () => {
    trackEventMock.mockRejectedValueOnce(new Error('Failed to send'));

    const { sendEvent } = useSendAnalyticsEvent();

    await sendEvent({
      event_type: 'send',
      request_path: '/error-path',
    });

    expect(trackEventMock).toHaveBeenCalledTimes(1);
    const payload = trackEventMock.mock.calls[0][0] as IAnalyticsEventRequest;
    expect(payload.body).toEqual({});
  });

  it('redacts sensitive fields from mutation bodies', async () => {
    const { sendEvent } = useSendAnalyticsEvent();

    await sendEvent({
      event_type: 'send',
      request_path: '/sensitive',
      httpRequestMethod: 'PATCH',
      body: {
        password: 'top-secret',
        identifier: 'user@example.com',
        code: '123456',
        csrf_token: 'csrf-token',
        city: 'Kyiv',
        state: 'CA',
        zip_code: '90210',
        country: 'US',
        nested: {
          access_token: 'access-token',
          account_number: '9876543210',
          keep: 'value',
        },
      },
    });

    expect(trackEventMock).toHaveBeenCalledTimes(1);
    const payload = trackEventMock.mock.calls[0][0] as IAnalyticsEventRequest;
    expect(payload.body).toEqual({
      password: '[redacted]',
      identifier: 'user@example.com',
      code: '[redacted]',
      csrf_token: '[redacted]',
      city: '[redacted]',
      state: '[redacted]',
      zip_code: '[redacted]',
      country: '[redacted]',
      nested: {
        access_token: '[redacted]',
        account_number: '[redacted]',
        keep: 'value',
      },
    });
  });
});
