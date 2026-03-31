import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { ref } from 'vue';

const userLoggedIn = ref(true);
const userSessionTraits = ref({ email: 'native@example.com' });
const getUserState = ref<{ data?: { id?: number } }>({ data: { id: 42 } });
const getUser = vi.fn().mockResolvedValue({ id: 42 });
const getAll = vi.fn().mockResolvedValue([]);
const updateNotificationsData = vi.fn();
const postMock = vi.fn().mockResolvedValue({});
const debugLog = vi.fn();
const reportError = vi.fn();
const createChannel = vi.fn().mockResolvedValue(undefined);
const removeAllDeliveredNotifications = vi.fn().mockResolvedValue(undefined);
const unregister = vi.fn().mockResolvedValue(undefined);
const listenerMap = new Map<string, (payload: any) => void | Promise<void>>();
const checkPermissions = vi.fn();
const requestPermissions = vi.fn();
const ANDROID_14_USER_AGENT = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/123.0.0.0 Mobile Safari/537.36';
const register = vi.fn(async () => {
  const callback = listenerMap.get('registration');
  if (callback) {
    await callback({ value: 'token-123' });
  }
});
const addListener = vi.fn(async (eventName: string, callback: (payload: any) => void | Promise<void>) => {
  listenerMap.set(eventName, callback);
  return {
    remove: vi.fn(),
  };
});

vi.mock('InvestCommon/config/env', () => ({
  default: {
    USER_URL: 'https://api.webdevelop.biz/user-api/v1.0',
    FRONTEND_URL: 'https://www.webdevelop.biz',
    FRONTEND_URL_STATIC: 'https://www.webdevelop.biz',
    FRONTEND_URL_DASHBOARD: 'https://www.webdevelop.biz/dashboard',
  },
}));

vi.mock('pinia', async () => {
  const actual = await vi.importActual<typeof import('pinia')>('pinia');
  return {
    ...actual,
    storeToRefs: (store: Record<string, unknown>) => store,
  };
});

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: () => ({
    userLoggedIn,
    userSessionTraits,
  }),
}));

vi.mock('InvestCommon/data/profiles/profiles.repository', () => ({
  useRepositoryProfiles: () => ({
    getUserState,
    getUser,
  }),
}));

vi.mock('InvestCommon/data/notifications/notifications.repository', () => ({
  useRepositoryNotifications: () => ({
    getAll,
    updateNotificationsData,
  }),
}));

vi.mock('InvestCommon/data/service/apiClient', () => ({
  ApiClient: class {
    post = postMock;
  },
}));

vi.mock('InvestCommon/domain/debug', () => ({
  debugLog,
}));

vi.mock('InvestCommon/domain/error/errorReporting', () => ({
  reportError,
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => true,
    getPlatform: () => 'android',
  },
}));

vi.mock('@capacitor/push-notifications', () => ({
  PushNotifications: {
    createChannel,
    addListener,
    checkPermissions,
    requestPermissions,
    register,
    removeAllDeliveredNotifications,
    unregister,
  },
}));

describe('nativePushNotifications runtime flow', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    userLoggedIn.value = true;
    userSessionTraits.value = { email: 'native@example.com' };
    getUserState.value = { data: { id: 42 } };
    listenerMap.clear();
    Object.defineProperty(window.navigator, 'userAgent', {
      value: ANDROID_14_USER_AGENT,
      configurable: true,
    });
    window.localStorage.clear();
  });

  it('shows the explainer only for authenticated native users with no prior decision', async () => {
    const mod = await import('../nativePushNotifications');

    expect(await mod.shouldShowNativePushExplainer(true)).toBe(true);

    mod.dismissNativePushExplainer();
    expect(mod.readNativePushExplainerDecision()).toBe('dismissed');
    expect(await mod.shouldShowNativePushExplainer(true)).toBe(false);
    expect(await mod.shouldShowNativePushExplainer(false)).toBe(false);
  });

  it('treats Android 12 as unsupported for milestone 1', async () => {
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 12; Pixel 5) AppleWebKit/537.36 Chrome/123.0.0.0 Mobile Safari/537.36',
      configurable: true,
    });

    const mod = await import('../nativePushNotifications');
    expect(await mod.shouldShowNativePushExplainer(true)).toBe(false);
  });

  it('accepts the explainer, requests permission, and subscribes using cookies without subscriber_id', async () => {
    checkPermissions.mockResolvedValue({ receive: 'prompt' });
    requestPermissions.mockResolvedValue({ receive: 'granted' });

    const mod = await import('../nativePushNotifications');
    await mod.acceptNativePushExplainer();

    expect(requestPermissions).toHaveBeenCalledTimes(1);
    expect(register).toHaveBeenCalledTimes(1);
    expect(postMock).toHaveBeenCalledWith('/auth/subscribe', {
      provider: 'fcm',
      device_token: 'token-123',
    }, expect.objectContaining({
      credentials: 'include',
    }));
    expect(postMock.mock.calls[0]?.[1]).not.toHaveProperty('subscriber_id');
    expect(mod.readNativePushExplainerDecision()).toBe('accepted');
    expect(mod.readNativePushPermissionOutcome()).toBe('granted');
  });

  it('does not auto-prompt for OS permission during silent ensure', async () => {
    checkPermissions.mockResolvedValue({ receive: 'prompt' });

    const mod = await import('../nativePushNotifications');
    mod.persistNativePushExplainerDecision('accepted');

    const result = await mod.ensureNativePushNotifications();

    expect(requestPermissions).not.toHaveBeenCalled();
    expect(register).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      didRegister: false,
      isSupported: true,
      permissionState: 'unknown',
    });
  });

  it('refreshes notifications when the foreground payload is partial', async () => {
    checkPermissions.mockResolvedValue({ receive: 'granted' });

    const mod = await import('../nativePushNotifications');
    await mod.ensureNativePushNotifications();

    const callback = listenerMap.get('pushNotificationReceived');
    await callback?.({
      data: {
        obj: 'wallet',
      },
    });

    expect(getAll).toHaveBeenCalledTimes(1);
    expect(updateNotificationsData).not.toHaveBeenCalled();
  });

  it('hydrates notifications directly when the foreground payload contains a full notification object', async () => {
    checkPermissions.mockResolvedValue({ receive: 'granted' });

    const mod = await import('../nativePushNotifications');
    await mod.ensureNativePushNotifications();

    const callback = listenerMap.get('pushNotificationReceived');
    await callback?.({
      data: {
        id: 17,
        user_id: 42,
        content: 'Wallet updated',
        status: 'unread',
        type: 'wallet',
        created_at: '2026-03-31T14:03:32.739576+00:00',
        updated_at: '2026-03-31T14:03:32.739576+00:00',
        data: {
          obj: 'wallet',
          object_id: 42,
          fields: {
            object_id: 42,
            profile: {
              id: 42,
            },
          },
        },
      },
    });

    expect(updateNotificationsData).toHaveBeenCalledTimes(1);
    expect(getAll).not.toHaveBeenCalled();
  });
});
