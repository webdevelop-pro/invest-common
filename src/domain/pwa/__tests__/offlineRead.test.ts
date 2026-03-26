import { describe, expect, it } from 'vitest';
import { APIError } from 'InvestCommon/data/service/handlers/apiError';
import { isBrowserOffline, isOfflineReadFailure } from '../offlineRead';

describe('offlineRead helpers', () => {
  it('detects explicit browser offline state', () => {
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: false,
    });

    expect(isBrowserOffline()).toBe(true);
    expect(isOfflineReadFailure(new Error('anything'))).toBe(true);
  });

  it('detects fetch-style network failures while navigator still reports online', () => {
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: true,
    });

    expect(isOfflineReadFailure(new Error('Failed to fetch'))).toBe(true);
    expect(isOfflineReadFailure(new Error('Network request failed'))).toBe(true);
  });

  it('does not classify API responses as offline read failures', () => {
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: true,
    });

    const response = new Response(JSON.stringify({ message: 'Missing' }), {
      status: 404,
      headers: {
        'content-type': 'application/json',
      },
    });
    const apiError = new APIError('Failed to fetch data', response);

    expect(isOfflineReadFailure(apiError)).toBe(false);
    expect(isOfflineReadFailure(new Error('Validation failed'))).toBe(false);
    expect(isOfflineReadFailure(undefined)).toBe(false);
  });
});

