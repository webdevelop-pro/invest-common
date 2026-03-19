import {
  computed,
  shallowRef,
} from 'vue';
import { isIosSafariBrowser, isPwaStandalone } from './pwaDetector';
import {
  isLocalPwaTestEnabled,
  isLocalPwaTestHost,
  logPwaDebug,
} from './pwaDebug';

const INSTALL_PROMPT_DISMISS_KEY = 'invest:pwa-install-prompt:dismissed-at';
const INSTALL_PROMPT_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const PWA_TEST_BEFORE_INSTALL_PROMPT_EVENT = 'invest:pwa-test:before-install-prompt';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
};

export type InstallPromptOutcome = 'accepted' | 'dismissed';
export type InstallPromptState = 'hidden' | 'native' | 'manual-ios';

const readDismissedAt = () => {
  if (typeof window === 'undefined') {
    return 0;
  }

  try {
    return Number(window.localStorage.getItem(INSTALL_PROMPT_DISMISS_KEY) || '0');
  } catch {
    return 0;
  }
};

const isInstallPromptDismissedRecently = (dismissedAt: number) => (
  dismissedAt > 0 && (Date.now() - dismissedAt) < INSTALL_PROMPT_COOLDOWN_MS
);

const writeDismissedAt = (dismissedAt: number) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(INSTALL_PROMPT_DISMISS_KEY, String(dismissedAt));
  } catch {
    // Ignore storage failures and simply keep the prompt in-memory only.
  }
};

const markInstallPromptDismissed = () => {
  const dismissedAt = Date.now();
  writeDismissedAt(dismissedAt);
  return dismissedAt;
};

const shouldSyncDismissedAtFromStorage = (key: string | null) => (
  key == null || key === INSTALL_PROMPT_DISMISS_KEY
);

const installPromptRuntime = {
  deferredPrompt: shallowRef<BeforeInstallPromptEvent | null>(null),
  isInstalled: shallowRef(false),
  dismissedAt: shallowRef(0),
  isIosSafari: shallowRef(false),
  localTestHost: shallowRef(false),
  listenersBound: false,
};

const isDismissed = computed(() => (
  isInstallPromptDismissedRecently(installPromptRuntime.dismissedAt.value)
));

const installState = computed<InstallPromptState>(() => {
  if (installPromptRuntime.isInstalled.value || isDismissed.value) {
    return 'hidden';
  }

  if (installPromptRuntime.deferredPrompt.value) {
    return 'native';
  }

  return installPromptRuntime.isIosSafari.value ? 'manual-ios' : 'hidden';
});

const syncDismissedState = () => {
  installPromptRuntime.dismissedAt.value = readDismissedAt();
  return isDismissed.value;
};

const syncRuntimeState = () => {
  installPromptRuntime.isInstalled.value = isPwaStandalone();
  return {
    isInstalled: installPromptRuntime.isInstalled.value,
    dismissedRecently: syncDismissedState(),
  };
};

const dismissInstallPrompt = (reason = 'dismissed-manually') => {
  installPromptRuntime.dismissedAt.value = markInstallPromptDismissed();
  logPwaDebug('install', 'hiding install prompt', {
    reason,
    hasDeferredPrompt: Boolean(installPromptRuntime.deferredPrompt.value),
    dismissedRecently: isDismissed.value,
    installState: installState.value,
  });
};

const setDeferredPrompt = (
  promptEvent: BeforeInstallPromptEvent,
  message: string,
  payload: Record<string, unknown> = {},
) => {
  installPromptRuntime.deferredPrompt.value = promptEvent;
  const dismissedRecently = syncDismissedState();

  logPwaDebug('install', message, {
    ...payload,
    dismissedRecently,
    installState: installState.value,
  });
};

const handleDismissedAtStorageChange = (event: StorageEvent) => {
  if (!shouldSyncDismissedAtFromStorage(event.key)) {
    return;
  }

  const previousDismissedAt = installPromptRuntime.dismissedAt.value;
  syncDismissedState();

  if (installPromptRuntime.dismissedAt.value === previousDismissedAt) {
    return;
  }

  logPwaDebug('install', 'synced install prompt dismissal from storage', {
    dismissedRecently: isDismissed.value,
    installState: installState.value,
  });
};

const handleVisibilityChange = () => {
  if (document.visibilityState !== 'visible') {
    return;
  }

  const previousInstallState = installState.value;
  const previousIsInstalled = installPromptRuntime.isInstalled.value;
  const previousDismissedAt = installPromptRuntime.dismissedAt.value;
  const runtimeState = syncRuntimeState();

  if (
    previousInstallState === installState.value
    && previousIsInstalled === installPromptRuntime.isInstalled.value
    && previousDismissedAt === installPromptRuntime.dismissedAt.value
  ) {
    return;
  }

  logPwaDebug('install', 'refreshed install prompt state after tab became visible', {
    ...runtimeState,
    installState: installState.value,
  });
};

const handleBeforeInstallPrompt = (event: Event) => {
  event.preventDefault();
  setDeferredPrompt(
    event as BeforeInstallPromptEvent,
    'received beforeinstallprompt event',
  );
};

const handleTestBeforeInstallPrompt = (event: Event) => {
  if (!isLocalPwaTestEnabled()) {
    return;
  }

  const customEvent = event as CustomEvent<{ outcome?: InstallPromptOutcome }>;
  const outcome = customEvent.detail?.outcome ?? 'accepted';

  setDeferredPrompt({
    prompt: async () => {},
    userChoice: Promise.resolve({
      outcome,
      platform: 'web',
    }),
  } as BeforeInstallPromptEvent, 'received local test install prompt event', {
    outcome,
  });
};

const handleAppInstalled = () => {
  installPromptRuntime.isInstalled.value = true;
  installPromptRuntime.deferredPrompt.value = null;
  logPwaDebug('install', 'received appinstalled event', {
    installState: installState.value,
  });
};

const bindWindowListeners = () => {
  if (typeof window === 'undefined' || installPromptRuntime.listenersBound) {
    return;
  }

  installPromptRuntime.localTestHost.value = isLocalPwaTestHost();
  installPromptRuntime.isIosSafari.value = isIosSafariBrowser();

  const runtimeState = syncRuntimeState();
  const localTestEnabled = isLocalPwaTestEnabled();

  logPwaDebug('install', 'initialized install prompt composable', {
    ...runtimeState,
    installState: installState.value,
    isIosSafari: installPromptRuntime.isIosSafari.value,
    localTestEnabled,
  });

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.addEventListener('appinstalled', handleAppInstalled);
  window.addEventListener('storage', handleDismissedAtStorageChange);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  if (installPromptRuntime.localTestHost.value) {
    window.addEventListener(PWA_TEST_BEFORE_INSTALL_PROMPT_EVENT, handleTestBeforeInstallPrompt);
  }

  installPromptRuntime.listenersBound = true;
};

const unbindWindowListeners = () => {
  if (typeof window === 'undefined' || !installPromptRuntime.listenersBound) {
    return;
  }

  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.removeEventListener('appinstalled', handleAppInstalled);
  window.removeEventListener('storage', handleDismissedAtStorageChange);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  if (installPromptRuntime.localTestHost.value) {
    window.removeEventListener(PWA_TEST_BEFORE_INSTALL_PROMPT_EVENT, handleTestBeforeInstallPrompt);
  }

  installPromptRuntime.listenersBound = false;
};

const resetInstallPromptRuntime = () => {
  installPromptRuntime.deferredPrompt.value = null;
  installPromptRuntime.isInstalled.value = false;
  installPromptRuntime.dismissedAt.value = 0;
  installPromptRuntime.isIosSafari.value = false;
  installPromptRuntime.localTestHost.value = false;
};

if (typeof window !== 'undefined') {
  bindWindowListeners();
}

export const resetPwaInstallPromptRuntimeForTests = () => {
  unbindWindowListeners();
  resetInstallPromptRuntime();
};

export function usePwaInstallPrompt() {
  if (typeof window !== 'undefined') {
    bindWindowListeners();
  }

  const canInstall = computed(() => installState.value === 'native');
  const showManualInstall = computed(() => installState.value === 'manual-ios');

  const promptInstall = async (): Promise<InstallPromptOutcome | null> => {
    if (!installPromptRuntime.deferredPrompt.value) {
      logPwaDebug('install', 'promptInstall called without a deferred prompt', {
        installState: installState.value,
      });
      return null;
    }

    const promptEvent = installPromptRuntime.deferredPrompt.value;
    logPwaDebug('install', 'triggering native install prompt', {
      installState: installState.value,
    });
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    logPwaDebug('install', 'native install prompt resolved', {
      outcome: choice.outcome,
      platform: choice.platform,
    });

    if (choice.outcome === 'accepted') {
      installPromptRuntime.deferredPrompt.value = null;
      return 'accepted';
    }

    installPromptRuntime.deferredPrompt.value = null;
    dismissInstallPrompt('dismissed-by-browser');
    return 'dismissed';
  };

  return {
    canInstall,
    installState,
    showManualInstall,
    promptInstall,
    dismissInstallPrompt,
  };
}
