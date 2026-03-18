import {
  computed,
  onBeforeUnmount,
  onMounted,
  shallowRef,
} from 'vue';
import { isIosSafariBrowser, isPwaStandalone } from './pwaDetector';

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

const isInstallPromptDismissedRecently = () => {
  const dismissedAt = readDismissedAt();
  return dismissedAt > 0 && (Date.now() - dismissedAt) < INSTALL_PROMPT_COOLDOWN_MS;
};

const markInstallPromptDismissed = () => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(INSTALL_PROMPT_DISMISS_KEY, String(Date.now()));
  } catch {
    // Ignore storage failures and simply keep the prompt in-memory only.
  }
};

const isLocalPwaTestEnabled = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  const isLocalHost = window.location.hostname === '127.0.0.1'
    || window.location.hostname === 'localhost';

  return isLocalHost && new URLSearchParams(window.location.search).has('__pwa_test');
};

export function usePwaInstallPrompt() {
  const deferredPrompt = shallowRef<BeforeInstallPromptEvent | null>(null);
  const isInstalled = shallowRef(false);
  const isDismissed = shallowRef(false);
  const installState = shallowRef<InstallPromptState>('hidden');

  const syncInstallState = () => {
    if (isInstalled.value || isDismissed.value) {
      installState.value = 'hidden';
      return;
    }

    if (deferredPrompt.value) {
      installState.value = 'native';
      return;
    }

    installState.value = isIosSafariBrowser() ? 'manual-ios' : 'hidden';
  };

  const hidePrompt = () => {
    isDismissed.value = true;
    markInstallPromptDismissed();
    installState.value = 'hidden';
  };

  const handleBeforeInstallPrompt = (event: Event) => {
    event.preventDefault();
    deferredPrompt.value = event as BeforeInstallPromptEvent;
    isDismissed.value = isInstallPromptDismissedRecently();
    syncInstallState();
  };

  const handleTestBeforeInstallPrompt = (event: Event) => {
    const customEvent = event as CustomEvent<{ outcome?: InstallPromptOutcome }>;
    const outcome = customEvent.detail?.outcome ?? 'accepted';

    deferredPrompt.value = {
      prompt: async () => {},
      userChoice: Promise.resolve({
        outcome,
        platform: 'web',
      }),
    } as BeforeInstallPromptEvent;
    isDismissed.value = isInstallPromptDismissedRecently();
    syncInstallState();
  };

  const handleAppInstalled = () => {
    isInstalled.value = true;
    deferredPrompt.value = null;
    isDismissed.value = true;
    syncInstallState();
  };

  onMounted(() => {
    isInstalled.value = isPwaStandalone();
    isDismissed.value = isInstallPromptDismissedRecently();
    syncInstallState();

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    if (isLocalPwaTestEnabled()) {
      window.addEventListener(PWA_TEST_BEFORE_INSTALL_PROMPT_EVENT, handleTestBeforeInstallPrompt);
    }
  });

  onBeforeUnmount(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.removeEventListener('appinstalled', handleAppInstalled);
    if (isLocalPwaTestEnabled()) {
      window.removeEventListener(PWA_TEST_BEFORE_INSTALL_PROMPT_EVENT, handleTestBeforeInstallPrompt);
    }
  });

  const canInstall = computed(() => installState.value === 'native');
  const showManualInstall = computed(() => installState.value === 'manual-ios');

  const promptInstall = async (): Promise<InstallPromptOutcome | null> => {
    if (!deferredPrompt.value) {
      return null;
    }

    const promptEvent = deferredPrompt.value;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;

    if (choice.outcome === 'accepted') {
      deferredPrompt.value = null;
      isDismissed.value = true;
      installState.value = 'hidden';
      return 'accepted';
    }

    hidePrompt();
    return 'dismissed';
  };

  return {
    canInstall,
    installState,
    showManualInstall,
    promptInstall,
    dismissInstallPrompt: hidePrompt,
  };
}
