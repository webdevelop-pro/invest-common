import {
  watch,
  type Ref,
} from 'vue';
import { useSendAnalyticsEvent } from 'InvestCommon/domain/analytics/useSendAnalyticsEvent';
import type { AnalyticsEventType } from 'InvestCommon/data/analytics/analytics.type';
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

const PWA_TELEMETRY_EVENTS = {
  installPromptShown: {
    eventType: 'open',
    httpRequestUrl: 'pwa://install/prompt-shown',
  },
  updateAvailable: {
    eventType: 'open',
    httpRequestUrl: 'pwa://update/available',
  },
  offlineReady: {
    eventType: 'open',
    httpRequestUrl: 'pwa://offline/ready',
  },
  offlineEntered: {
    eventType: 'open',
    httpRequestUrl: 'pwa://offline/entered',
  },
  reconnected: {
    eventType: 'close',
    httpRequestUrl: 'pwa://offline/reconnected',
  },
  registrationFailed: {
    eventType: 'send',
    httpRequestUrl: 'pwa://service-worker/register',
    statusCode: 500,
  },
  installAccepted: {
    eventType: 'click',
    httpRequestUrl: 'pwa://install/accepted',
  },
  installDismissed: {
    eventType: 'close',
    httpRequestUrl: 'pwa://install/dismissed',
  },
  updateAccepted: {
    eventType: 'click',
    httpRequestUrl: 'pwa://update/accepted',
  },
  updateDismissed: {
    eventType: 'close',
    httpRequestUrl: 'pwa://update/dismissed',
  },
  offlineReadyDismissed: {
    eventType: 'close',
    httpRequestUrl: 'pwa://offline/ready-dismissed',
  },
} as const satisfies Record<string, {
  eventType: AnalyticsEventType;
  httpRequestUrl: string;
  statusCode?: number;
}>;

type PwaTelemetryEventKey = keyof typeof PWA_TELEMETRY_EVENTS;

export function usePwaTelemetry(options: UsePwaTelemetryOptions) {
  const { sendEvent } = useSendAnalyticsEvent({
    serviceName: 'vitepress-pwa',
  });

  const track = (eventKey: PwaTelemetryEventKey) => void sendEvent({
    event_type: PWA_TELEMETRY_EVENTS[eventKey].eventType,
    request_path: getRequestPath(),
    status_code: PWA_TELEMETRY_EVENTS[eventKey].statusCode ?? 200,
    httpRequestUrl: PWA_TELEMETRY_EVENTS[eventKey].httpRequestUrl,
  });

  watch(options.installState, (value, oldValue) => {
    if (value !== 'hidden' && oldValue === 'hidden') {
      track('installPromptShown');
    }
  });

  watch(options.isUpdateReady, (value, oldValue) => {
    if (value && !oldValue) {
      track('updateAvailable');
    }
  });

  watch(options.isOfflineReady, (value, oldValue) => {
    if (value && !oldValue) {
      track('offlineReady');
    }
  });

  watch(options.isOffline, (value, oldValue) => {
    if (value && !oldValue) {
      track('offlineEntered');
    }
  });

  watch(options.isReconnected, (value, oldValue) => {
    if (value && !oldValue) {
      track('reconnected');
    }
  });

  watch(options.registrationError, (value, oldValue) => {
    if (value && value !== oldValue) {
      track('registrationFailed');
    }
  });

  const handleInstall = async () => {
    const outcome = await options.promptInstall();

    if (outcome === 'accepted') {
      track('installAccepted');
    } else if (outcome === 'dismissed') {
      track('installDismissed');
    }
  };

  const handleDismissInstall = () => {
    options.dismissInstallPrompt();
    track('installDismissed');
  };

  const handleReloadApp = async () => {
    track('updateAccepted');
    await options.reloadApp();
  };

  const handleDismissUpdate = () => {
    options.dismissUpdateReady();
    track('updateDismissed');
  };

  const handleDismissOfflineReady = () => {
    options.dismissOfflineReady();
    track('offlineReadyDismissed');
  };

  return {
    handleInstall,
    handleDismissInstall,
    handleReloadApp,
    handleDismissUpdate,
    handleDismissOfflineReady,
  };
}
