import {
  computed,
  onBeforeUnmount,
  shallowRef,
} from 'vue';
import {
  isLocalPwaTestEnabled,
  isLocalPwaTestHost,
  logPwaDebug,
  toPwaDebugError,
} from './pwaDebug';
import {
  type PwaRegistrationBridge,
  usePwaRegistrationBridge,
} from './pwaRegistrationBridge';

const PWA_TEST_UPDATE_READY_EVENT = 'invest:pwa-test:update-ready';
const SERVICE_WORKER_RELOAD_TIMEOUT_MS = 2500;

export type PwaUpdateLifecycleState =
  | 'idle'
  | 'offlineReady'
  | 'updateReady'
  | 'reloading'
  | 'registrationError';

const createControllerChangeWatcher = (
  serviceWorker?: ServiceWorkerContainer | null,
) => {
  if (typeof window === 'undefined' || !serviceWorker) {
    return null;
  }

  let settled = false;
  let timeoutId = 0;
  let resolvePromise: (value: boolean) => void = () => {};

  const finish = (value: boolean) => {
    if (settled) {
      return;
    }

    settled = true;
    window.clearTimeout(timeoutId);
    serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    resolvePromise(value);
  };

  const handleControllerChange = () => {
    logPwaDebug('update', 'service worker controller changed');
    finish(true);
  };

  const promise = new Promise<boolean>((resolve) => {
    resolvePromise = resolve;
    serviceWorker.addEventListener('controllerchange', handleControllerChange);
    timeoutId = window.setTimeout(() => {
      finish(false);
    }, SERVICE_WORKER_RELOAD_TIMEOUT_MS);
  });

  return {
    promise,
    cancel: () => {
      finish(false);
    },
  };
};

export function usePwaUpdatePrompt() {
  const bridge = shallowRef<PwaRegistrationBridge | null>(null);
  const serviceWorker = typeof navigator === 'undefined' ? null : navigator.serviceWorker;
  const localTestHost = isLocalPwaTestHost();
  const testUpdateReadyState = shallowRef(false);
  const registrationError = shallowRef<unknown>(null);
  const isReloading = shallowRef(false);

  const updateBridgeFlags = (flags: {
    needRefresh?: boolean;
    offlineReady?: boolean;
  }) => {
    if (!bridge.value) {
      return;
    }

    if (typeof flags.needRefresh === 'boolean') {
      bridge.value.needRefresh.value = flags.needRefresh;
    }

    if (typeof flags.offlineReady === 'boolean') {
      bridge.value.offlineReady.value = flags.offlineReady;
    }
  };

  const handleTestUpdateReady = () => {
    if (!isLocalPwaTestEnabled()) {
      return;
    }

    testUpdateReadyState.value = true;
    updateBridgeFlags({ needRefresh: true, offlineReady: false });
    logPwaDebug('update', 'received local test update-ready event');
  };

  const clearUpdateReady = () => {
    testUpdateReadyState.value = false;
    updateBridgeFlags({ needRefresh: false });
  };

  const handleServiceWorkerControllerChange = () => {
    testUpdateReadyState.value = false;
    updateBridgeFlags({ needRefresh: false, offlineReady: false });
    isReloading.value = false;
    logPwaDebug('update', 'reset local test update-ready state after controllerchange');
  };

  const initializeBridge = () => {
    try {
      bridge.value = usePwaRegistrationBridge();
      registrationError.value = null;
      logPwaDebug('update', 'initialized pwa registration bridge', {
        needRefresh: bridge.value.needRefresh.value,
        offlineReady: bridge.value.offlineReady.value,
        hasUpdateServiceWorker: bridge.value.updateServiceWorker != null,
        hasCleanup: bridge.value.cleanup != null,
      });
    } catch (error) {
      bridge.value = null;
      registrationError.value = error;
      logPwaDebug('update', 'failed to initialize pwa registration bridge', {
        error: toPwaDebugError(error),
      });
    }
  };

  if (typeof window !== 'undefined') {
    initializeBridge();

    serviceWorker?.addEventListener('controllerchange', handleServiceWorkerControllerChange);

    if (localTestHost) {
      window.addEventListener(PWA_TEST_UPDATE_READY_EVENT, handleTestUpdateReady);
    }
  }

  onBeforeUnmount(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (localTestHost) {
      window.removeEventListener(PWA_TEST_UPDATE_READY_EVENT, handleTestUpdateReady);
    }

    bridge.value?.cleanup?.();
    serviceWorker?.removeEventListener('controllerchange', handleServiceWorkerControllerChange);
  });

  const isUpdateReady = computed(() => (bridge.value?.needRefresh.value ?? false) || testUpdateReadyState.value);
  const isOfflineReady = computed(() => (bridge.value?.offlineReady.value ?? false) && !isUpdateReady.value);
  const lifecycleState = computed<PwaUpdateLifecycleState>(() => {
    if (registrationError.value) {
      return 'registrationError';
    }
    if (isReloading.value) {
      return 'reloading';
    }
    if (isUpdateReady.value) {
      return 'updateReady';
    }
    if (isOfflineReady.value) {
      return 'offlineReady';
    }
    return 'idle';
  });

  const reloadApp = async () => {
    logPwaDebug('update', 'refresh app clicked', {
      lifecycleState: lifecycleState.value,
      isUpdateReady: isUpdateReady.value,
      isOfflineReady: isOfflineReady.value,
      needRefresh: bridge.value?.needRefresh.value ?? null,
      offlineReady: bridge.value?.offlineReady.value ?? null,
    });
    isReloading.value = true;
    const controllerChangeWatcher = createControllerChangeWatcher(serviceWorker);

    try {
      await bridge.value?.updateServiceWorker(true);
      logPwaDebug('update', 'updateServiceWorker resolved', {
        hasControllerChangeWatcher: Boolean(controllerChangeWatcher),
      });

      if (!controllerChangeWatcher) {
        logPwaDebug('update', 'controller change watcher unavailable; leaving reloading state');
        isReloading.value = false;
        return;
      }

      const didControllerChange = await controllerChangeWatcher.promise;
      logPwaDebug('update', 'controller change wait finished', {
        didControllerChange,
      });

      isReloading.value = false;

      // Workbox reloads once the updated worker controls the page. If takeover
      // never happens, keep the prompt available so the user can retry.
      if (!didControllerChange) {
        logPwaDebug('update', 'controller change timed out; keeping update prompt visible');
      }
    } catch (error) {
      controllerChangeWatcher?.cancel();
      logPwaDebug('update', 'refresh app failed', {
        error: toPwaDebugError(error),
      });
      isReloading.value = false;
      throw error;
    }
  };

  const dismissOfflineReady = () => {
    updateBridgeFlags({ offlineReady: false });
    logPwaDebug('update', 'dismissed offline-ready state');
  };

  const dismissUpdateReady = () => {
    clearUpdateReady();
    logPwaDebug('update', 'dismissed update-ready state');
  };

  return {
    isUpdateReady,
    isOfflineReady,
    lifecycleState,
    registrationError,
    reloadApp,
    dismissOfflineReady,
    dismissUpdateReady,
  };
}
