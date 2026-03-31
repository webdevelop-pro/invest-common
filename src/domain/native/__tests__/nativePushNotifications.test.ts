import { describe, expect, it, vi } from 'vitest';

vi.mock('InvestCommon/config/env', () => ({
  default: {
    FRONTEND_URL: 'https://www.webdevelop.biz',
    FRONTEND_URL_STATIC: 'https://www.webdevelop.biz',
    FRONTEND_URL_DASHBOARD: 'https://www.webdevelop.biz/dashboard',
  },
}));

import {
  coerceNativePushNotification,
  normalizeNativeAppPath,
  normalizeNativePushSubscriberId,
  resolveNativePushTarget,
} from '../nativePushNotifications';

describe('nativePushNotifications helpers', () => {
  it('normalizes subscriber ids for backend push subscriptions', () => {
    expect(normalizeNativePushSubscriberId(' John.Doe+qa@Example.com ')).toBe('john_doe_qa_example_');
    expect(normalizeNativePushSubscriberId('')).toBe('');
  });

  it('normalizes internal app urls back to local in-app paths', () => {
    const appOrigins = ['https://www.webdevelop.biz', 'https://www.webdevelop.biz/dashboard'];

    expect(
      normalizeNativeAppPath('https://www.webdevelop.biz/dashboard/notifications?tab=all', appOrigins),
    ).toBe('/dashboard/notifications?tab=all');
    expect(normalizeNativeAppPath('/dashboard/notifications', appOrigins)).toBe('/dashboard/notifications');
    expect(normalizeNativeAppPath('https://example.com/news', appOrigins)).toBeNull();
  });

  it('coerces raw push payloads into notification entities', () => {
    const payload = {
      id: '17',
      user_id: '99',
      content: 'Wallet updated',
      status: 'unread',
      type: 'wallet',
      created_at: '2026-03-30T10:00:00.000Z',
      updated_at: '2026-03-30T10:00:00.000Z',
      data: JSON.stringify({
        obj: 'wallet',
        object_id: 42,
        fields: {
          object_id: 42,
          profile: {
            id: 42,
          },
        },
      }),
    };

    expect(coerceNativePushNotification(payload)).toMatchObject({
      id: 17,
      user_id: 99,
      type: 'wallet',
      data: {
        object_id: 42,
      },
    });
  });

  it('returns null for partial notification payloads that do not satisfy the contract', () => {
    expect(coerceNativePushNotification({
      type: 'wallet',
      data: {
        obj: 'wallet',
      },
    })).toBeNull();
  });

  it('resolves direct deep links from push payload data', () => {
    const appOrigins = ['https://www.webdevelop.biz', 'https://www.webdevelop.biz/dashboard'];
    const fallbackHref = 'https://www.webdevelop.biz/dashboard/notifications';

    expect(resolveNativePushTarget({
      link: 'https://www.webdevelop.biz/dashboard/profile/42/wallet',
    }, {
      appOrigins,
      fallbackHref,
    })).toBe('/dashboard/profile/42/wallet');
  });

  it('falls back to formatted notification destinations when raw notification data is present', () => {
    const appOrigins = ['https://www.webdevelop.biz', 'https://www.webdevelop.biz/dashboard'];
    const fallbackHref = 'https://www.webdevelop.biz/dashboard/notifications';

    expect(resolveNativePushTarget({
      notification: {
        id: 11,
        user_id: 8,
        content: 'Wallet balance changed',
        status: 'unread',
        type: 'wallet',
        created_at: '2026-03-30T10:00:00.000Z',
        updated_at: '2026-03-30T10:00:00.000Z',
        data: {
          obj: 'wallet',
          object_id: 27,
          fields: {
            object_id: 27,
            profile: {
              id: 27,
            },
          },
        },
      },
    }, {
      appOrigins,
      fallbackHref,
    })).toBe('/dashboard/profile/27/wallet');
  });

  it('falls back to the notifications inbox when the payload cannot resolve a specific target', () => {
    const appOrigins = ['https://www.webdevelop.biz', 'https://www.webdevelop.biz/dashboard'];
    const fallbackHref = 'https://www.webdevelop.biz/dashboard/notifications';

    expect(resolveNativePushTarget({
      foo: 'bar',
    }, {
      appOrigins,
      fallbackHref,
    })).toBe('/dashboard/notifications');
  });
});
