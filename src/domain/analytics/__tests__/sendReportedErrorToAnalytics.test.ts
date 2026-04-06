import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AnalyticsLogLevel } from 'InvestCommon/data/analytics/analytics.type';

const logMessageMock = vi.fn<[], Promise<unknown>>();

vi.mock('InvestCommon/data/analytics/analytics.repository', () => ({
  useRepositoryAnalytics: () => ({
    logMessage: (...args: unknown[]) => logMessageMock(...(args as [])),
  }),
}));

vi.mock('InvestCommon/config/env', () => ({
  default: {
    ENABLE_ANALYTICS: '1',
  },
}));

const buildHttpRequestMock = vi.fn(() => ({
  method: 'POST',
  url: '/from-mock',
  path: '/from-mock',
  userAgent: 'mock-ua',
  referer: '-',
  remoteIp: '-',
  protocol: 'https:',
}));

const getClientContextMock = vi.fn(() => ({
  userAgent: 'mock-ua',
}));

const normalizeGroupMessageMock = vi.fn((msg: string) => `normalized:${msg}`);

vi.mock('InvestCommon/domain/analytics/useAnalyticsError', () => ({
  buildHttpRequest: (...args: unknown[]) => buildHttpRequestMock(...args),
  getClientContext: (...args: unknown[]) => getClientContextMock(...args),
  normalizeGroupMessage: (...args: unknown[]) => normalizeGroupMessageMock(...args),
}));

import { sendReportedErrorToAnalytics } from '../sendReportedErrorToAnalytics';

describe('sendReportedErrorToAnalytics', () => {
  const originalNavigator = global.navigator;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(global, 'navigator', {
      value: { userAgent: 'Mozilla/5.0' },
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      configurable: true,
    });
  });

  it('logs error to analytics when enabled and not a bot', () => {
    const normalized = {
      message: 'Something broke',
      code: 'E_TEST',
      statusCode: 500,
    };

    sendReportedErrorToAnalytics(normalized as any, 'Fallback message', {
      serviceName: 'vue3-app',
    });

    expect(logMessageMock).toHaveBeenCalledTimes(1);
    const payload = logMessageMock.mock.calls[0][0] as any;

    expect(payload.level).toBe(AnalyticsLogLevel.ERROR);
    expect(normalizeGroupMessageMock).toHaveBeenCalledWith('Something broke');
    expect(payload.message).toBe('normalized:Something broke');

    expect(payload.error).toContain('Fallback message');
    expect(payload.error).toContain('Something broke');

    expect(buildHttpRequestMock).toHaveBeenCalled();
    expect(getClientContextMock).toHaveBeenCalled();

    expect(payload.body).toEqual({});
    expect(payload.data.serviceContext.httpRequest).toEqual(buildHttpRequestMock.mock.results[0].value);
    expect(payload.data.serviceContext.service_name).toBe('vue3-app');
    expect(payload.data.client).toEqual(getClientContextMock.mock.results[0].value);
  });

  it('forwards request body to analytics logs for mutation requests', () => {
    buildHttpRequestMock.mockReturnValueOnce({
      method: 'PATCH',
      url: '/from-mock',
      path: '/from-mock',
      userAgent: 'mock-ua',
      referer: '-',
      remoteIp: '-',
      protocol: 'https:',
    });

    const normalized = {
      message: 'Something broke',
      code: 'E_TEST',
      statusCode: 500,
    };

    sendReportedErrorToAnalytics(normalized as any, 'Fallback message', {
      serviceName: 'vue3-app',
      body: {
        code: '123456',
        email: 'user@example.com',
        first_name: 'Jamie',
        totp_code: '123456',
        city: 'Kyiv',
        state: 'CA',
        zip_code: '90210',
        country: 'US',
        remember_device: true,
        nested: {
          access_token: 'secret-token',
          account_number: '9876543210',
          keep: true,
        },
      },
    });

    expect(logMessageMock).toHaveBeenCalledTimes(1);
    const payload = logMessageMock.mock.calls[0][0] as any;
    expect(payload.body).toEqual({
      code: '[redacted]',
      email: '[redacted]',
      first_name: '[redacted]',
      totp_code: '[redacted]',
      city: '[redacted]',
      state: '[redacted]',
      zip_code: '[redacted]',
      country: '[redacted]',
      remember_device: true,
      nested: {
        access_token: '[redacted]',
        account_number: '[redacted]',
        keep: true,
      },
    });
  });

  it('skips analytics when user agent is a bot', () => {
    Object.defineProperty(global, 'navigator', {
      value: { userAgent: 'Googlebot' },
      configurable: true,
    });

    const normalized = {
      message: 'Something broke',
      code: 'E_TEST',
      statusCode: 500,
    };

    sendReportedErrorToAnalytics(normalized as any, 'Fallback message', {
      serviceName: 'vue3-app',
    });

    expect(logMessageMock).not.toHaveBeenCalled();
  });

  it('does not throw when analytics client rejects', () => {
    logMessageMock.mockRejectedValueOnce(new Error('analytics failed'));

    const normalized = {
      message: 'Something broke',
      code: 'E_TEST',
      statusCode: 500,
    };

    sendReportedErrorToAnalytics(normalized as any, 'Fallback message', {
      serviceName: 'vue3-app',
    });

    expect(logMessageMock).toHaveBeenCalledTimes(1);
  });
});
