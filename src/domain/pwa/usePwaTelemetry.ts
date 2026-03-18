import {
  watch,
  type Ref,
} from 'vue';
import { useSendAnalyticsEvent } from 'InvestCommon/domain/analytics/useSendAnalyticsEvent';
import type { InstallPromptOutcome, InstallPromptState } from './usePwaInstallPrompt';

type MaybeError = unknown;

export interface UsePwaTelemetryOptions {
  canInstall: Readonly<Ref<boolean>>;
  installState: Readonly<Ref<InstallPromptState>>;
  isUpdateReady: Readonly<Ref<boolean>>;
  isOfflineReady: Readonly<Ref<boolean>>;
  isOffline: Readonly<Ref<boolean>>;
  isReconnected: Readonly<Ref<boolean>>;
  registrationError: Readonly<Ref<MaybeError>>;
  promptInstall: () => Promise<InstallPromptOutcome | null>;
  dismissInstallPrompt: () => void;
  reloadApp: () => Promise<void>;
  dismissUpdateReady: () => void;
  dismissOfflineReady: () => void;
}

const getRequestPath = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.location.pathname || '/';
};

export function usePwaTelemetry(options: UsePwaTelemetryOptions) {
  const { sendEvent } = useSendAnalyticsEvent({
    serviceName: 'vitepress-pwa',
  });

  const track = (eventType: string, statusCode = 200) => void sendEvent({
    event_type: eventType,
    request_path: getRequestPath(),
    status_code: statusCode,
  });

  watch(options.installState, (value, oldValue) => {
    if (value !== 'hidden' && oldValue === 'hidden') {
      track('pwa_install_prompt_shown');
    }
  });

  watch(options.isUpdateReady, (value, oldValue) => {
    if (value && !oldValue) {
      track('pwa_update_available');
    }
  });

  watch(options.isOfflineReady, (value, oldValue) => {
    if (value && !oldValue) {
      track('pwa_offline_ready');
    }
  });

  watch(options.isOffline, (value, oldValue) => {
    if (value && !oldValue) {
      track('pwa_offline_entered');
    }
  });

  watch(options.isReconnected, (value, oldValue) => {
    if (value && !oldValue) {
      track('pwa_reconnected');
    }
  });

  watch(options.registrationError, (value, oldValue) => {
    if (value && value !== oldValue) {
      void sendEvent({
        event_type: 'pwa_sw_registration_failed',
        request_path: getRequestPath(),
        status_code: 500,
        service_name: 'vitepress-pwa',
        httpRequestUrl: 'pwa://service-worker/register',
      });
    }
  });

  const handleInstall = async () => {
    const outcome = await options.promptInstall();

    if (outcome === 'accepted') {
      track('pwa_install_accepted');
    } else if (outcome === 'dismissed') {
      track('pwa_install_dismissed');
    }
  };

  const handleDismissInstall = () => {
    options.dismissInstallPrompt();
    track('pwa_install_dismissed');
  };

  const handleReloadApp = async () => {
    track('pwa_update_accepted');
    await options.reloadApp();
  };

  const handleDismissUpdate = () => {
    options.dismissUpdateReady();
    track('pwa_update_dismissed');
  };

  const handleDismissOfflineReady = () => {
    options.dismissOfflineReady();
    track('pwa_offline_ready_dismissed');
  };

  return {
    handleInstall,
    handleDismissInstall,
    handleReloadApp,
    handleDismissUpdate,
    handleDismissOfflineReady,
  };
}
