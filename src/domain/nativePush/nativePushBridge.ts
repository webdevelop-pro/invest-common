import type { PluginListenerHandle } from '@capacitor/core';
import type {
  ActionPerformed,
  PushNotificationsPlugin,
  PushNotificationSchema,
  RegistrationError,
  Token,
} from '@capacitor/push-notifications';
import { watch, type WatchStopHandle } from 'vue';
import { storeToRefs } from 'pinia';
import { ApiClient } from 'InvestCommon/data/service/apiClient';
import env from 'InvestCommon/config/env';
import { NotificationFormatter } from 'InvestCommon/data/notifications/notifications.formatter';
import { useRepositoryNotifications } from 'InvestCommon/data/notifications/notifications.repository';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { reportError } from 'InvestCommon/domain/error/errorReporting';
import { urlNotifications } from 'InvestCommon/domain/config/links';
import {
  clearNativePushTokenSyncState,
  getForegroundPushHandling,
  isAndroidCapacitorRuntime,
  markNativePushTokenSynced,
  NATIVE_PUSH_NOTIFICATIONS_FALLBACK_PATH,
  NATIVE_PUSH_PROVIDER,
  parseNativePushNotificationPayload,
  persistExplainerDecision,
  persistPermissionDecision,
  readExplainerDecision,
  readPermissionDecision,
  resolveNativePushDestination,
  shouldSubscribeNativePushToken,
} from './nativePushCore';

type NativePushModules = {
  PushNotifications: PushNotificationsPlugin;
};

const subscriptionClient = new ApiClient(env.USER_URL || 'https://api.webdevelop.biz/user-api/v1.0');

let isBridgeInstalled = false;
let isRegistrationInFlight = false;
let stopSessionWatch: WatchStopHandle | null = null;
let listenerHandles: PluginListenerHandle[] = [];
let registeredUserId = '';

function getBrowserStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function getNotificationsFallbackHref() {
  return resolveNativePushDestination(
    urlNotifications?.startsWith('undefined') ? '' : urlNotifications,
    NATIVE_PUSH_NOTIFICATIONS_FALLBACK_PATH,
  );
}

async function loadNativePushModules(): Promise<NativePushModules | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const [{ Capacitor }, { PushNotifications }] = await Promise.all([
      import('@capacitor/core'),
      import('@capacitor/push-notifications'),
    ]);

    const isEligible = isAndroidCapacitorRuntime({
      isNativePlatform: Capacitor.isNativePlatform(),
      platform: Capacitor.getPlatform(),
      isPushPluginAvailable: Capacitor.isPluginAvailable('PushNotifications'),
    });

    if (!isEligible) {
      return null;
    }

    return { PushNotifications };
  } catch {
    return null;
  }
}

async function subscribeFcmTokenWithPwaSession(token: string) {
  await subscriptionClient.post('/auth/subscribe', {
    provider: NATIVE_PUSH_PROVIDER,
    device_token: token,
  }, {
    showGlobalAlertOnServerError: false,
  });
}

async function syncNativePushToken(token: string) {
  const storage = getBrowserStorage();

  if (!storage || !registeredUserId || !token) {
    return;
  }

  if (!shouldSubscribeNativePushToken(storage, registeredUserId, token)) {
    return;
  }

  await subscribeFcmTokenWithPwaSession(token);
  markNativePushTokenSynced(storage, registeredUserId, token);
}

async function createDefaultChannel(PushNotifications: PushNotificationsPlugin) {
  try {
    await PushNotifications.createChannel({
      id: 'invest-pro-default',
      name: 'Invest PRO',
      description: 'Account, offering, wallet, and platform updates',
      importance: 4,
      visibility: 1,
    });
  } catch {
    // Channel creation is Android-only and recoverable.
  }
}

async function handleForegroundPush(notification: PushNotificationSchema) {
  const parseResult = parseNativePushNotificationPayload(notification);
  const notificationsRepository = useRepositoryNotifications();

  if (getForegroundPushHandling(parseResult) === 'hydrate' && parseResult.ok) {
    try {
      notificationsRepository.updateNotificationsData(JSON.stringify(parseResult.notification));
      return;
    } catch (error) {
      reportError(error, 'Failed to update notifications from push', { source: 'nativePush' });
    }
  }

  try {
    await notificationsRepository.getAll();
  } catch (error) {
    reportError(error, 'Failed to refresh notifications from push', { source: 'nativePush' });
  }
}

function resolveTapDestination(notification: PushNotificationSchema): string {
  const parseResult = parseNativePushNotificationPayload(notification);
  const fallback = getNotificationsFallbackHref();

  if (!parseResult.ok) {
    return fallback;
  }

  try {
    return resolveNativePushDestination(
      new NotificationFormatter(parseResult.notification).format().buttonHref,
      fallback,
    );
  } catch {
    return fallback;
  }
}

function handlePushTap(action: ActionPerformed) {
  if (typeof window === 'undefined') {
    return;
  }

  window.location.assign(resolveTapDestination(action.notification));
}

async function ensureNativePushListeners(PushNotifications: PushNotificationsPlugin) {
  if (listenerHandles.length > 0) {
    return;
  }

  listenerHandles = await Promise.all([
    PushNotifications.addListener('registration', (token: Token) => {
      void syncNativePushToken(token.value).catch((error) => {
        reportError(error, 'Failed to subscribe this device for push notifications', { source: 'nativePush' });
      });
    }),
    PushNotifications.addListener('registrationError', (error: RegistrationError) => {
      reportError(error, 'Failed to register this device for push notifications', { source: 'nativePush' });
    }),
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      void handleForegroundPush(notification);
    }),
    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      handlePushTap(action);
    }),
  ]);
}

async function ensureNativePushRegistration(userId: string) {
  const storage = getBrowserStorage();

  if (!storage || isRegistrationInFlight) {
    return;
  }

  isRegistrationInFlight = true;

  try {
    const nativeModules = await loadNativePushModules();

    if (!nativeModules) {
      return;
    }

    let explainerDecision = readExplainerDecision(storage);

    if (!explainerDecision) {
      const accepted = window.confirm(
        'Enable push notifications for account, offering, wallet, and platform updates?',
      );
      explainerDecision = accepted ? 'accepted' : 'rejected';
      persistExplainerDecision(storage, explainerDecision);
    }

    if (explainerDecision !== 'accepted') {
      return;
    }

    const { PushNotifications } = nativeModules;
    const storedPermissionDecision = readPermissionDecision(storage);
    let permissionStatus = await PushNotifications.checkPermissions();

    if (storedPermissionDecision === 'denied' && permissionStatus.receive !== 'granted') {
      return;
    }

    if (permissionStatus.receive !== 'granted') {
      permissionStatus = await PushNotifications.requestPermissions();
    }

    if (permissionStatus.receive !== 'granted') {
      persistPermissionDecision(storage, 'denied');
      return;
    }

    persistPermissionDecision(storage, 'granted');
    registeredUserId = userId;
    await createDefaultChannel(PushNotifications);
    await ensureNativePushListeners(PushNotifications);
    await PushNotifications.register();
  } catch (error) {
    reportError(error, 'Failed to enable push notifications', { source: 'nativePush' });
  } finally {
    isRegistrationInFlight = false;
  }
}

export function installAndroidNativePushBridge() {
  if (isBridgeInstalled || typeof window === 'undefined') {
    return;
  }

  isBridgeInstalled = true;

  const sessionStore = useSessionStore();
  const { isSessionHydrated, userLoggedIn, userSession } = storeToRefs(sessionStore);

  stopSessionWatch = watch(
    [
      isSessionHydrated,
      userLoggedIn,
      () => userSession.value?.identity?.id || userSession.value?.id || '',
    ],
    ([isHydrated, isLoggedIn, userId]) => {
      if (isHydrated && isLoggedIn && userId) {
        void ensureNativePushRegistration(userId);
      }
    },
    { immediate: true },
  );
}

async function removeNativePushListeners() {
  if (listenerHandles.length === 0) {
    return;
  }

  const handles = listenerHandles;
  listenerHandles = [];
  await Promise.all(handles.map((handle) => handle.remove()));
}

export async function cleanupAndroidNativePushBridgeOnLogout() {
  const storage = getBrowserStorage();

  registeredUserId = '';

  if (storage) {
    clearNativePushTokenSyncState(storage);
  }

  try {
    await removeNativePushListeners();
    const nativeModules = await loadNativePushModules();
    await nativeModules?.PushNotifications.unregister();
  } catch (error) {
    reportError(error, 'Failed to clear local push registration', { source: 'nativePush' });
  }
}

export function uninstallAndroidNativePushBridge() {
  stopSessionWatch?.();
  stopSessionWatch = null;
  isBridgeInstalled = false;
}
