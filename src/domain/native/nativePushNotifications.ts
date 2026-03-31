import { storeToRefs } from 'pinia';
import env from 'InvestCommon/config/env';
import { urlNotifications } from 'InvestCommon/domain/config/links';
import { NotificationFormatter } from 'InvestCommon/data/notifications/notifications.formatter';
import type {
  INotification,
  INotificationDataFields,
} from 'InvestCommon/data/notifications/notifications.types';
import { useRepositoryNotifications } from 'InvestCommon/data/notifications/notifications.repository';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { ApiClient } from 'InvestCommon/data/service/apiClient';
import { debugLog } from 'InvestCommon/domain/debug';
import { reportError } from 'InvestCommon/domain/error/errorReporting';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import type {
  ActionPerformed,
  Channel,
  PushNotificationSchema,
  Token,
} from '@capacitor/push-notifications';

const PUSH_PROVIDER = 'fcm';
const PUSH_SUBSCRIBE_PATH = '/auth/subscribe';
const PUSH_EXPLAINER_STORAGE_KEY = 'invest:native-push-explainer';
const PUSH_PERMISSION_STORAGE_KEY = 'invest:native-push-permission';
const PUSH_SYNC_STORAGE_KEY = 'invest:native-push-sync';
const PUSH_CHANNEL_ID = 'invest-pro-notifications';
const PUSH_CHANNEL_NAME = 'Invest PRO Notifications';
const PUSH_CHANNEL_DESCRIPTION = 'Account, offering, and wallet updates';
const FALLBACK_NOTIFICATION_PATH = '/dashboard/notifications';
const DEFAULT_NOTIFICATION_TIMESTAMP = '1970-01-01T00:00:00.000Z';

type PersistedPushSyncState = {
  userKey: string;
  token: string;
};

type NativePushTargetOptions = {
  appOrigins?: string[];
  fallbackHref?: string;
};

export type NativePushExplainerDecision = 'unknown' | 'accepted' | 'dismissed';
export type NativePushPermissionOutcome = 'unknown' | 'granted' | 'denied';
type PersistedNativePushExplainerDecision = Exclude<NativePushExplainerDecision, 'unknown'>;
type PersistedNativePushPermissionOutcome = Exclude<NativePushPermissionOutcome, 'unknown'>;
type EnsureNativePushNotificationsOptions = {
  requestPermission?: boolean;
};

export type EnsureNativePushNotificationsResult = {
  didRegister: boolean;
  isSupported: boolean;
  permissionState: NativePushPermissionOutcome;
};

const subscribeApiClient = new ApiClient(env.USER_URL);

let isChannelCreated = false;
let isRegistering = false;
let listenersInstalled = false;
let currentRegistrationToken = '';

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const parseJsonRecord = (value: string): Record<string, unknown> | null => {
  try {
    const parsed = JSON.parse(value) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const toRecord = (value: unknown): Record<string, unknown> | null => {
  if (isRecord(value)) {
    return value;
  }

  if (typeof value === 'string') {
    return parseJsonRecord(value);
  }

  return null;
};

const toStringValue = (value: unknown): string | null => (
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
);

const toNumberValue = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const isExplainerDecision = (
  value: string | null,
): value is PersistedNativePushExplainerDecision => (
  value === 'accepted' || value === 'dismissed'
);

const isPermissionOutcome = (
  value: string | null,
): value is PersistedNativePushPermissionOutcome => (
  value === 'granted' || value === 'denied'
);

const persistNativePushPermissionOutcome = (state: NativePushPermissionOutcome) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (state === 'unknown') {
    window.localStorage.removeItem(PUSH_PERMISSION_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(PUSH_PERMISSION_STORAGE_KEY, state);
};

const toNativePushPermissionOutcome = (value: string | null | undefined): NativePushPermissionOutcome => {
  if (value === 'granted') {
    return 'granted';
  }

  if (value === 'denied') {
    return 'denied';
  }

  return 'unknown';
};

export const readNativePushExplainerDecision = (): NativePushExplainerDecision => {
  if (typeof window === 'undefined') {
    return 'unknown';
  }

  const value = window.localStorage.getItem(PUSH_EXPLAINER_STORAGE_KEY);
  return isExplainerDecision(value) ? value : 'unknown';
};

export const persistNativePushExplainerDecision = (
  decision: PersistedNativePushExplainerDecision,
) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(PUSH_EXPLAINER_STORAGE_KEY, decision);
};

export const readNativePushPermissionOutcome = (): NativePushPermissionOutcome => {
  if (typeof window === 'undefined') {
    return 'unknown';
  }

  const value = window.localStorage.getItem(PUSH_PERMISSION_STORAGE_KEY);
  return isPermissionOutcome(value) ? value : 'unknown';
};

const readPersistedPushSyncState = (): PersistedPushSyncState | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(PUSH_SYNC_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  const parsed = parseJsonRecord(raw);
  if (!parsed) {
    return null;
  }

  const userKey = toStringValue(parsed.userKey);
  const token = toStringValue(parsed.token);

  if (!userKey || !token) {
    return null;
  }

  return {
    userKey,
    token,
  };
};

const persistPushSyncState = (state: PersistedPushSyncState) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(PUSH_SYNC_STORAGE_KEY, JSON.stringify(state));
};

export const clearNativePushSyncState = () => {
  currentRegistrationToken = '';

  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(PUSH_SYNC_STORAGE_KEY);
};

export const normalizeNativePushSubscriberId = (value?: string | null): string => (
  (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 20)
);

const buildAppOrigins = (): string[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  const candidates = [
    window.location.origin,
    env.FRONTEND_URL,
    env.FRONTEND_URL_STATIC,
    env.FRONTEND_URL_DASHBOARD,
  ];

  return [...new Set(candidates.flatMap((candidate) => {
    if (!candidate) {
      return [];
    }

    try {
      return [new URL(candidate, window.location.origin).origin];
    } catch {
      return [];
    }
  }))];
};

export const normalizeNativeAppPath = (
  candidate: string | null | undefined,
  appOrigins: string[] = buildAppOrigins(),
): string | null => {
  const value = candidate?.trim();
  if (!value) {
    return null;
  }

  if (value.startsWith('/')) {
    return value;
  }

  try {
    if (typeof window === 'undefined') {
      return null;
    }

    const url = new URL(value, window.location.origin);
    if (appOrigins.includes(url.origin)) {
      return `${url.pathname}${url.search}${url.hash}` || '/';
    }
    return null;
  } catch {
    return `/${value.replace(/^\/+/, '')}`;
  }
};

const getDirectRouteCandidate = (record: Record<string, unknown> | null): string | null => {
  if (!record) {
    return null;
  }

  const directKeys = [
    'path',
    'route',
    'url',
    'href',
    'link',
    'deeplink',
    'deepLink',
    'target_url',
    'targetUrl',
    'click_action',
  ] as const;

  for (const key of directKeys) {
    const value = toStringValue(record[key]);
    if (value) {
      return value;
    }
  }

  return null;
};

export const coerceNativePushNotification = (candidate: unknown): INotification | null => {
  const record = toRecord(candidate);
  if (!record) {
    return null;
  }

  const nestedCandidate = record.notification ?? record.payload ?? record.rawNotification ?? record.message;
  if (nestedCandidate !== undefined && nestedCandidate !== candidate) {
    const nestedNotification = coerceNativePushNotification(nestedCandidate);
    if (nestedNotification) {
      return nestedNotification;
    }
  }

  const dataRecord = toRecord(record.data) ?? {};
  const fieldsRecord = toRecord(dataRecord.fields) ?? {};

  const id = toNumberValue(record.id);
  const userId = toNumberValue(record.user_id ?? record.userId);
  const content = toStringValue(record.content);
  const type = toStringValue(record.type);

  if (!id || !userId || !content || !type) {
    return null;
  }

  return {
    id,
    user_id: userId,
    content,
    status: toStringValue(record.status) ?? 'unread',
    type,
    created_at: toStringValue(record.created_at) ?? DEFAULT_NOTIFICATION_TIMESTAMP,
    updated_at: toStringValue(record.updated_at) ?? DEFAULT_NOTIFICATION_TIMESTAMP,
    data: {
      obj: toStringValue(dataRecord.obj) ?? 'notification',
      object_id: toNumberValue(dataRecord.object_id ?? fieldsRecord.object_id) ?? 0,
      fields: fieldsRecord as INotificationDataFields,
    },
  };
};

export const resolveNativePushTarget = (
  candidate: unknown,
  options: NativePushTargetOptions = {},
): string => {
  const appOrigins = options.appOrigins ?? buildAppOrigins();
  const fallbackHref = options.fallbackHref ?? urlNotifications;
  const record = toRecord(candidate);
  const nestedDataRecord = toRecord(record?.data) ?? toRecord(record?.payload) ?? null;

  const directTarget = (
    getDirectRouteCandidate(record)
    ?? getDirectRouteCandidate(nestedDataRecord)
  );
  const normalizedDirectTarget = normalizeNativeAppPath(directTarget, appOrigins);
  if (normalizedDirectTarget) {
    return normalizedDirectTarget;
  }

  const notification = (
    coerceNativePushNotification(candidate)
    ?? coerceNativePushNotification(record?.notification)
    ?? coerceNativePushNotification(record?.payload)
    ?? coerceNativePushNotification(record?.data)
  );

  if (notification) {
    const formatted = new NotificationFormatter(notification).format();
    const formattedTarget = normalizeNativeAppPath(formatted.buttonHref, appOrigins);
    if (formattedTarget) {
      return formattedTarget;
    }
  }

  return normalizeNativeAppPath(fallbackHref, appOrigins) ?? FALLBACK_NOTIFICATION_PATH;
};

const getCapacitorRuntime = () => import('@capacitor/core');
const getPushNotificationsPlugin = () => import('@capacitor/push-notifications');

const getNativeAndroidMajorVersion = (): number | null => {
  if (typeof navigator === 'undefined') {
    return null;
  }

  const match = navigator.userAgent.match(/Android\s+(\d+)/i);
  if (!match?.[1]) {
    return null;
  }

  const version = Number(match[1]);
  return Number.isFinite(version) ? version : null;
};

export const isNativeAndroidPushSupported = async (): Promise<boolean> => {
  const { Capacitor } = await getCapacitorRuntime();
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return false;
  }

  const androidMajorVersion = getNativeAndroidMajorVersion();
  return androidMajorVersion !== null && androidMajorVersion >= 13;
};

const createDefaultChannel = async () => {
  if (isChannelCreated || !(await isNativeAndroidPushSupported())) {
    return;
  }

  const { PushNotifications } = await getPushNotificationsPlugin();
  const channel: Channel = {
    id: PUSH_CHANNEL_ID,
    name: PUSH_CHANNEL_NAME,
    description: PUSH_CHANNEL_DESCRIPTION,
    importance: 5,
    visibility: 1,
  };

  await PushNotifications.createChannel(channel);
  isChannelCreated = true;
  debugLog('native push channel created', channel.id);
};

const getLoggedInPushSyncUserKey = async (): Promise<string> => {
  const sessionStore = useSessionStore();
  const { userSessionTraits } = storeToRefs(sessionStore);

  const profilesRepository = useRepositoryProfiles();
  const { getUserState } = storeToRefs(profilesRepository);

  const currentUserId = getUserState.value.data?.id;
  if (typeof currentUserId === 'number' && Number.isFinite(currentUserId)) {
    return String(currentUserId);
  }

  try {
    const user = await profilesRepository.getUser();
    if (typeof user?.id === 'number' && Number.isFinite(user.id)) {
      return String(user.id);
    }
  } catch (error) {
    reportError(error, 'Failed to resolve the native push sync user key', { silent: true });
  }

  return normalizeNativePushSubscriberId(userSessionTraits.value?.email);
};

const syncPushTokenToBackend = async (token: string) => {
  if (!token) {
    return;
  }

  const sessionStore = useSessionStore();
  const { userLoggedIn } = storeToRefs(sessionStore);
  if (!userLoggedIn.value) {
    return;
  }

  const userKey = await getLoggedInPushSyncUserKey();
  if (!userKey) {
    debugLog('native push sync user key missing, skipping token sync');
    return;
  }

  const persisted = readPersistedPushSyncState();
  if (persisted?.token === token && persisted.userKey === userKey) {
    return;
  }

  await subscribeApiClient.post(PUSH_SUBSCRIBE_PATH, {
    provider: PUSH_PROVIDER,
    device_token: token,
  }, {
    credentials: 'include',
    showGlobalAlertOnServerError: false,
  });

  persistPushSyncState({
    userKey,
    token,
  });
  debugLog('native push token synced', userKey);
};

const refreshNotificationsSilently = async () => {
  const sessionStore = useSessionStore();
  const { userLoggedIn } = storeToRefs(sessionStore);
  if (!userLoggedIn.value) {
    return;
  }

  try {
    await useRepositoryNotifications().getAll();
  } catch (error) {
    reportError(error, 'Failed to refresh notifications after a native push', { silent: true });
  }
};

const hydrateNotificationsFromPush = async (candidate: unknown) => {
  const notification = (
    coerceNativePushNotification(candidate)
    ?? coerceNativePushNotification(toRecord(candidate)?.notification)
    ?? coerceNativePushNotification(toRecord(candidate)?.payload)
    ?? coerceNativePushNotification(toRecord(candidate)?.data)
  );

  if (notification) {
    useRepositoryNotifications().updateNotificationsData(JSON.stringify(notification));
    return;
  }

  await refreshNotificationsSilently();
};

const navigateToNativePushTarget = (candidate: unknown) => {
  if (typeof window === 'undefined') {
    return;
  }

  const targetPath = resolveNativePushTarget(candidate);
  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (currentPath === targetPath) {
    return;
  }

  window.location.assign(targetPath);
};

const handleRegistration = async (token: Token) => {
  currentRegistrationToken = token.value;
  debugLog('native push registration token received');

  try {
    await syncPushTokenToBackend(token.value);
  } catch (error) {
    reportError(error, 'Failed to sync the native push registration token', { silent: true });
  }
};

const handlePushNotificationReceived = async (notification: PushNotificationSchema) => {
  debugLog('native push notification received', notification);
  await hydrateNotificationsFromPush(notification.data);
};

const handlePushNotificationAction = async (action: ActionPerformed) => {
  debugLog('native push notification action performed', action.actionId);
  await hydrateNotificationsFromPush(action.notification.data);
  navigateToNativePushTarget(action.notification.data);
};

const installNativePushListeners = async () => {
  if (listenersInstalled || !(await isNativeAndroidPushSupported())) {
    return;
  }

  const { PushNotifications } = await getPushNotificationsPlugin();

  await PushNotifications.addListener('registration', (token) => {
    void handleRegistration(token);
  });

  await PushNotifications.addListener('registrationError', (error) => {
    reportError(error, 'Failed to register native push notifications', { silent: true });
  });

  await PushNotifications.addListener('pushNotificationReceived', (notification) => {
    void handlePushNotificationReceived(notification);
  });

  await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    void handlePushNotificationAction(notification);
  });

  listenersInstalled = true;
};

export const shouldShowNativePushExplainer = async (isAuthenticated: boolean): Promise<boolean> => {
  if (!isAuthenticated || !(await isNativeAndroidPushSupported())) {
    return false;
  }

  return readNativePushExplainerDecision() === 'unknown';
};

export const dismissNativePushExplainer = () => {
  persistNativePushExplainerDecision('dismissed');
};

export const ensureNativePushNotifications = async (
  options: EnsureNativePushNotificationsOptions = {},
): Promise<EnsureNativePushNotificationsResult> => {
  const { requestPermission = false } = options;
  if (!(await isNativeAndroidPushSupported())) {
    return {
      didRegister: false,
      isSupported: false,
      permissionState: 'unknown',
    };
  }

  if (isRegistering) {
    return {
      didRegister: false,
      isSupported: true,
      permissionState: readNativePushPermissionOutcome(),
    };
  }

  isRegistering = true;
  let permissionState = readNativePushPermissionOutcome();

  try {
    await installNativePushListeners();
    await createDefaultChannel();

    const { PushNotifications } = await getPushNotificationsPlugin();
    let permissionStatus = await PushNotifications.checkPermissions();
    permissionState = toNativePushPermissionOutcome(permissionStatus.receive);

    if (requestPermission && permissionStatus.receive !== 'granted') {
      permissionStatus = await PushNotifications.requestPermissions();
      permissionState = toNativePushPermissionOutcome(permissionStatus.receive);
    }

    persistNativePushPermissionOutcome(permissionState);

    if (permissionStatus.receive !== 'granted') {
      debugLog('native push permission not granted');
      return {
        didRegister: false,
        isSupported: true,
        permissionState,
      };
    }

    const cachedState = readPersistedPushSyncState();
    currentRegistrationToken = currentRegistrationToken || cachedState?.token || '';
    if (currentRegistrationToken) {
      await syncPushTokenToBackend(currentRegistrationToken);
    }

    await PushNotifications.register();
    persistNativePushPermissionOutcome('granted');

    return {
      didRegister: true,
      isSupported: true,
      permissionState: 'granted',
    };
  } catch (error) {
    reportError(error, 'Failed to initialize native push notifications', { silent: true });
    return {
      didRegister: false,
      isSupported: true,
      permissionState,
    };
  } finally {
    isRegistering = false;
  }
};

export const acceptNativePushExplainer = async () => {
  persistNativePushExplainerDecision('accepted');
  return ensureNativePushNotifications({
    requestPermission: true,
  });
};

export const disableNativePushNotifications = async () => {
  clearNativePushSyncState();

  if (!(await isNativeAndroidPushSupported())) {
    return;
  }

  try {
    const { PushNotifications } = await getPushNotificationsPlugin();
    await PushNotifications.removeAllDeliveredNotifications();
    await PushNotifications.unregister();
  } catch (error) {
    reportError(error, 'Failed to disable native push notifications', { silent: true });
  }
};
