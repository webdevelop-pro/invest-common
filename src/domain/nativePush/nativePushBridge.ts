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
import { useGlobalAlert } from 'UiKit/store/useGlobalAlert';
import {
  clearNativePushTokenSyncState,
  createNativePushTokenSyncKey,
  getForegroundPushHandling,
  isAndroidCapacitorRuntime,
  markNativePushTokenSynced,
  NATIVE_PUSH_DEFAULT_CHANNEL_ID,
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

type NativePushRegistrationMode = 'silent' | 'user-consent';

type NativePushRegistrationResult =
  | 'registered'
  | 'already-in-flight'
  | 'not-eligible'
  | 'not-authenticated'
  | 'no-storage'
  | 'explainer-not-accepted'
  | 'permission-not-granted';

type NativePushWindow = Window & {
  InvestNativePush?: {
    requestPermission: () => Promise<NativePushRegistrationResult>;
    shouldShowPermissionButton: () => Promise<boolean>;
  };
};

const subscriptionClient = new ApiClient(env.USER_URL || '');
const REQUEST_ANDROID_NATIVE_PUSH_PERMISSION_EVENT = 'invest:native-push:request-permission';
export const NATIVE_PUSH_AUTH_SUCCESS_EVENT = 'invest:native-push:auth-success';
const NATIVE_PUSH_REGISTRATION_TIMEOUT_MS = 15000;

let isBridgeInstalled = false;
let isRegistrationInFlight = false;
let stopSessionWatch: WatchStopHandle | null = null;
let listenerHandles: PluginListenerHandle[] = [];
let registeredUserId = '';
let isWindowEntrypointInstalled = false;
const tokenSyncRequests = new Map<string, Promise<void>>();

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
  if (!env.USER_URL) {
    throw new Error('USER_URL is not configured for native push subscription.');
  }

  await subscriptionClient.post('/auth/subscribe', {
    provider: NATIVE_PUSH_PROVIDER,
    device_token: token,
  }, {
    showGlobalAlertOnServerError: false,
  });
}

async function syncNativePushToken(token: string, userId = registeredUserId) {
  const storage = getBrowserStorage();

  if (!storage || !userId || !token) {
    return;
  }

  if (!shouldSubscribeNativePushToken(storage, userId, token)) {
    return;
  }

  const syncKey = createNativePushTokenSyncKey(userId, token);
  const existingRequest = tokenSyncRequests.get(syncKey);

  if (existingRequest) {
    await existingRequest;
    return;
  }

  const syncRequest = subscribeFcmTokenWithPwaSession(token)
    .then(() => {
      markNativePushTokenSynced(storage, userId, token);
    })
    .finally(() => {
      tokenSyncRequests.delete(syncKey);
    });

  tokenSyncRequests.set(syncKey, syncRequest);
  await syncRequest;
}

function showNativePushSetupError(message: string) {
  try {
    const globalAlert = useGlobalAlert();
    globalAlert.show({
      variant: 'error',
      title: 'Push notifications unavailable',
      message,
    });
  } catch {
    // Error reporting already records the failure; the alert store may be unavailable in tests.
  }
}

function reportNativePushSetupError(error: unknown, fallbackMessage: string) {
  reportError(error, fallbackMessage, { source: 'nativePush', silent: true });
  showNativePushSetupError(
    `${fallbackMessage}. Please check the Firebase configuration and try enabling notifications again.`,
  );
}

async function createDefaultChannel(PushNotifications: PushNotificationsPlugin) {
  try {
    await PushNotifications.createChannel({
      id: NATIVE_PUSH_DEFAULT_CHANNEL_ID,
      name: 'Invest PRO',
      description: 'Account, offering, wallet, and platform updates',
      importance: 4,
      visibility: 1,
    });
  } catch {
    // Channel creation is Android-only and recoverable.
  }
}

function getAuthenticatedUserId(): string {
  const sessionStore = useSessionStore();
  const session = sessionStore.userSession;

  if (!sessionStore.isSessionHydrated || !sessionStore.userLoggedIn) {
    return '';
  }

  return session?.identity?.id || session?.id || '';
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
      void syncNativePushToken(token.value, registeredUserId).catch((error) => {
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

async function registerForFcmToken(PushNotifications: PushNotificationsPlugin): Promise<string> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let handles: PluginListenerHandle[] = [];

  const cleanup = async () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }

    const currentHandles = handles;
    handles = [];
    await Promise.all(currentHandles.map((handle) => handle.remove()));
  };

  return new Promise<string>((resolve, reject) => {
    let settled = false;

    const settle = (callback: () => void) => {
      if (settled) {
        return;
      }

      settled = true;
      void cleanup().finally(callback);
    };

    timeoutId = setTimeout(() => {
      settle(() => reject(new Error('Timed out while waiting for an FCM registration token.')));
    }, NATIVE_PUSH_REGISTRATION_TIMEOUT_MS);

    void (async () => {
      handles = await Promise.all([
        PushNotifications.addListener('registration', (token: Token) => {
          if (!token.value) {
            settle(() => reject(new Error('FCM registration completed without a device token.')));
            return;
          }

          settle(() => resolve(token.value));
        }),
        PushNotifications.addListener('registrationError', (error: RegistrationError) => {
          settle(() => reject(new Error(error.error || 'FCM registration failed.')));
        }),
      ]);

      await PushNotifications.register();
    })().catch((error) => {
      settle(() => reject(error));
    });
  });
}

async function ensureNativePushRegistration(
  userId: string,
  mode: NativePushRegistrationMode,
): Promise<NativePushRegistrationResult> {
  const storage = getBrowserStorage();

  if (!userId) {
    return 'not-authenticated';
  }

  if (!storage) {
    return 'no-storage';
  }

  if (isRegistrationInFlight) {
    return 'already-in-flight';
  }

  isRegistrationInFlight = true;

  try {
    const nativeModules = await loadNativePushModules();

    if (!nativeModules) {
      return 'not-eligible';
    }

    let explainerDecision = readExplainerDecision(storage);

    if (!explainerDecision && mode === 'user-consent') {
      explainerDecision = 'accepted';
      persistExplainerDecision(storage, explainerDecision);
    }

    if (explainerDecision !== 'accepted') {
      return 'explainer-not-accepted';
    }

    const { PushNotifications } = nativeModules;
    const storedPermissionDecision = readPermissionDecision(storage);
    let permissionStatus = await PushNotifications.checkPermissions();

    if (
      storedPermissionDecision === 'denied'
      && permissionStatus.receive !== 'granted'
      && mode === 'silent'
    ) {
      return 'permission-not-granted';
    }

    if (permissionStatus.receive !== 'granted') {
      if (mode === 'silent') {
        return 'permission-not-granted';
      }

      permissionStatus = await PushNotifications.requestPermissions();
    }

    if (permissionStatus.receive !== 'granted') {
      persistPermissionDecision(storage, 'denied');
      return 'permission-not-granted';
    }

    persistPermissionDecision(storage, 'granted');
    registeredUserId = userId;
    await createDefaultChannel(PushNotifications);
    await ensureNativePushListeners(PushNotifications);
    const token = await registerForFcmToken(PushNotifications);
    try {
      await syncNativePushToken(token, userId);
    } catch (error) {
      reportError(error, 'Failed to subscribe this device for push notifications', { source: 'nativePush' });
    }
    return 'registered';
  } catch (error) {
    reportNativePushSetupError(error, 'Failed to enable push notifications');
    return 'permission-not-granted';
  } finally {
    isRegistrationInFlight = false;
  }
}

export async function requestAndroidNativePushPermissionConsent(): Promise<NativePushRegistrationResult> {
  return ensureNativePushRegistration(getAuthenticatedUserId(), 'user-consent');
}

export async function shouldShowAndroidNativePushExplainer(): Promise<boolean> {
  if (!getAuthenticatedUserId()) {
    return false;
  }

  const storage = getBrowserStorage();

  if (!storage || readExplainerDecision(storage)) {
    return false;
  }

  const nativeModules = await loadNativePushModules();

  if (!nativeModules) {
    return false;
  }

  const permissionStatus = await nativeModules.PushNotifications.checkPermissions();
  return permissionStatus.receive !== 'granted';
}

export function rejectAndroidNativePushExplainer() {
  const storage = getBrowserStorage();

  if (!storage) {
    return;
  }

  persistExplainerDecision(storage, 'rejected');
}

export async function shouldShowAndroidNativePushPermissionButton(): Promise<boolean> {
  if (!getAuthenticatedUserId()) {
    return false;
  }

  const nativeModules = await loadNativePushModules();

  if (!nativeModules) {
    return false;
  }

  const storage = getBrowserStorage();

  if (storage && readExplainerDecision(storage) === 'rejected') {
    return false;
  }

  const permissionStatus = await nativeModules.PushNotifications.checkPermissions();
  return permissionStatus.receive !== 'granted';
}

export function notifyAndroidNativePushAuthSuccess() {
  if (typeof window === 'undefined') {
    return;
  }

  window.setTimeout(() => {
    window.dispatchEvent(new CustomEvent(NATIVE_PUSH_AUTH_SUCCESS_EVENT));
  }, 0);
}

function handleNativePushPermissionEvent() {
  void requestAndroidNativePushPermissionConsent();
}

function installNativePushWindowEntrypoint() {
  if (isWindowEntrypointInstalled || typeof window === 'undefined') {
    return;
  }

  isWindowEntrypointInstalled = true;

  (window as NativePushWindow).InvestNativePush = {
    requestPermission: requestAndroidNativePushPermissionConsent,
    shouldShowPermissionButton: shouldShowAndroidNativePushPermissionButton,
  };
  window.addEventListener(REQUEST_ANDROID_NATIVE_PUSH_PERMISSION_EVENT, handleNativePushPermissionEvent);
}

export function installAndroidNativePushBridge() {
  if (isBridgeInstalled || typeof window === 'undefined') {
    return;
  }

  isBridgeInstalled = true;
  installNativePushWindowEntrypoint();

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
        void ensureNativePushRegistration(userId, 'silent');
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
  if (typeof window !== 'undefined' && isWindowEntrypointInstalled) {
    window.removeEventListener(REQUEST_ANDROID_NATIVE_PUSH_PERMISSION_EVENT, handleNativePushPermissionEvent);
  }
  isWindowEntrypointInstalled = false;
  isBridgeInstalled = false;
}
