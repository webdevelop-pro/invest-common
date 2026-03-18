import {
  computed,
  onBeforeUnmount,
  shallowRef,
  watch,
  type Ref,
} from 'vue';
import { useRegisterSW } from 'virtual:pwa-register/vue';

const PWA_TEST_UPDATE_READY_EVENT = 'invest:pwa-test:update-ready';
const SERVICE_WORKER_RELOAD_FALLBACK_MS = 2500;

export type PwaUpdateLifecycleState =
  | 'idle'
  | 'offlineReady'
  | 'updateReady'
  | 'reloading'
  | 'registrationError';

const isLocalPwaTestEnabled = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  const isLocalHost = window.location.hostname === '127.0.0.1'
    || window.location.hostname === 'localhost';

  return isLocalHost && new URLSearchParams(window.location.search).has('__pwa_test');
};

export const reloadCurrentPage = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.location.reload();
};

export const pwaUpdatePromptRuntime = {
  reloadCurrentPage,
};

export function usePwaUpdatePrompt() {
  const needRefresh = shallowRef<Ref<boolean> | null>(null);
  const offlineReady = shallowRef<Ref<boolean> | null>(null);
  const updateServiceWorker = shallowRef<((reloadPage?: boolean) => Promise<void>) | null>(null);
  const updateReadyState = shallowRef(false);
  const offlineReadyState = shallowRef(false);
  const registrationError = shallowRef<unknown>(null);
  const isReloading = shallowRef(false);

  const syncFlag = (source: Ref<boolean>, target: typeof updateReadyState) => {
    watch(() => source.value, (value) => {
      target.value = value;
    }, { immediate: true });
  };

  const handleTestUpdateReady = () => {
    updateReadyState.value = true;
    offlineReadyState.value = false;

    if (needRefresh.value) {
      needRefresh.value.value = true;
    }

    if (offlineReady.value) {
      offlineReady.value.value = false;
    }
  };

  const createControllerChangeWatcher = () => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined' || !navigator.serviceWorker) {
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
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      resolvePromise(value);
    };

    const handleControllerChange = () => {
      finish(true);
    };

    const promise = new Promise<boolean>((resolve) => {
      resolvePromise = resolve;
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
      timeoutId = window.setTimeout(() => {
        finish(false);
      }, SERVICE_WORKER_RELOAD_FALLBACK_MS);
    });

    return {
      promise,
      cancel: () => {
        finish(false);
      },
    };
  };

  if (typeof window !== 'undefined') {
    try {
      const sw = useRegisterSW({
        immediate: true,
      });

      needRefresh.value = sw.needRefresh;
      offlineReady.value = sw.offlineReady;
      updateServiceWorker.value = sw.updateServiceWorker;

      syncFlag(sw.needRefresh, updateReadyState);
      syncFlag(sw.offlineReady, offlineReadyState);
      registrationError.value = null;
    } catch (error) {
      registrationError.value = error;
    }

    if (isLocalPwaTestEnabled()) {
      window.addEventListener(PWA_TEST_UPDATE_READY_EVENT, handleTestUpdateReady);
    }
  }

  onBeforeUnmount(() => {
    if (!isLocalPwaTestEnabled()) {
      return;
    }

    window.removeEventListener(PWA_TEST_UPDATE_READY_EVENT, handleTestUpdateReady);
  });

  const isUpdateReady = computed(() => updateReadyState.value);
  const isOfflineReady = computed(() => offlineReadyState.value);
  const lifecycleState = computed<PwaUpdateLifecycleState>(() => {
    if (registrationError.value) {
      return 'registrationError';
    }
    if (isReloading.value) {
      return 'reloading';
    }
    if (updateReadyState.value) {
      return 'updateReady';
    }
    if (offlineReadyState.value) {
      return 'offlineReady';
    }
    return 'idle';
  });

  const reloadApp = async () => {
    isReloading.value = true;
    const controllerChangeWatcher = createControllerChangeWatcher();

    try {
      await updateServiceWorker.value?.(true);

      if (controllerChangeWatcher) {
        const didControllerChange = await controllerChangeWatcher.promise;

        if (!didControllerChange) {
          pwaUpdatePromptRuntime.reloadCurrentPage();
        }
      }
    } catch (error) {
      controllerChangeWatcher?.cancel();
      isReloading.value = false;
      throw error;
    }
  };

  const dismissOfflineReady = () => {
    offlineReadyState.value = false;
    if (offlineReady.value) {
      offlineReady.value.value = false;
    }
  };

  const dismissUpdateReady = () => {
    updateReadyState.value = false;
    if (needRefresh.value) {
      needRefresh.value.value = false;
    }
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
