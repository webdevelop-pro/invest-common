const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? '';

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const isPushSupported = () =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

const logPrefix = '[push-client]';

export const getRegistration = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isPushSupported()) {
    console.info(`${logPrefix} Push not supported in this environment`);
    return null;
  }
  try {
    return await navigator.serviceWorker.ready;
  } catch (error) {
    console.error(`${logPrefix} Failed to resolve service worker`, error);
    return null;
  }
};

export const getExistingSubscription = async () => {
  const registration = await getRegistration();
  if (!registration) {
    return null;
  }
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    console.info(`${logPrefix} Existing subscription`, subscription.endpoint);
  } else {
    console.info(`${logPrefix} No active subscription`);
  }
  return subscription;
};

export const subscribeToPush = async () => {
  const registration = await getRegistration();
  if (!registration) {
    throw new Error("Service worker registration is not available.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Push permission was not granted by the user.');
  }

  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    console.info(`${logPrefix} Reusing existing subscription`);
    return existing;
  }

  if (!VAPID_PUBLIC_KEY) {
    console.warn(
      `${logPrefix} Missing VITE_VAPID_PUBLIC_KEY env. Subscribing without applicationServerKey.`,
    );
  }

  const options: PushSubscriptionOptionsInit = {
    userVisibleOnly: true,
  };

  if (VAPID_PUBLIC_KEY) {
    options.applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
  }

  const subscription = await registration.pushManager.subscribe(options);
  console.info(`${logPrefix} Subscription created`, subscription.endpoint);
  console.debug(`${logPrefix} Subscription payload`, JSON.stringify(subscription));
  return subscription;
};

export const unsubscribeFromPush = async () => {
  const subscription = await getExistingSubscription();
  if (!subscription) {
    return false;
  }
  const result = await subscription.unsubscribe();
  console.info(`${logPrefix} Subscription removed`, result);
  return result;
};

export const exposePushDebugTools = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const debugTools = {
    isPushSupported: () => isPushSupported(),
    getExistingSubscription,
    subscribeToPush,
    unsubscribeFromPush,
  };

  Object.defineProperty(window, '__InvestPush', {
    value: debugTools,
    configurable: false,
    writable: false,
  });

  console.info(
    `${logPrefix} Debug helpers attached to window.__InvestPush (subscribeToPush, unsubscribeFromPush, getExistingSubscription).`,
  );
};
