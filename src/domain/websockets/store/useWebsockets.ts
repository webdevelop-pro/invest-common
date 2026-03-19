import { ref, watch, type WatchStopHandle } from 'vue';
import { INotification } from 'InvestCommon/data/notifications/notifications.types';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { useWebSocket } from '@vueuse/core';
import env from 'InvestCommon/config/env';
import { useRepositoryNotifications } from 'InvestCommon/data/notifications/notifications.repository';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useRepositoryWallet } from 'InvestCommon/data/wallet/wallet.repository';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import { useRepositoryOffer } from 'InvestCommon/data/offer/offer.repository';
import { useRepositoryFiler } from 'InvestCommon/data/filer/filer.repository';
import { useRepositoryEvm } from 'InvestCommon/data/evm/evm.repository';
import { debugLog } from 'InvestCommon/domain/debug';

const { NOTIFICATION_URL } = env;

const TOAST_OPTIONS = {
  title: 'Failed to connect WebSocket after 3 retries',
  variant: 'error' as const,
};

const isBrowserOffline = () => (
  typeof navigator !== 'undefined' && navigator.onLine === false
);

export const useDomainWebSocketStore = defineStore('domainWebsockets', () => {
  const userSessionStore = useSessionStore();
  const { userLoggedIn } = storeToRefs(userSessionStore);

  // Instantiate stores/repositories once
  const repositoryProfiles = useRepositoryProfiles();
  const repositoryWallet = useRepositoryWallet();
  const repositoryNotifications = useRepositoryNotifications();
  const repositoryInvestment = useRepositoryInvestment();
  const repositoryOffer = useRepositoryOffer();
  const repositoryFiler = useRepositoryFiler();
  const repositoryEvm = useRepositoryEvm();

  const isConnectingOrOpen = ref(false);
  let stopUserLoggedInWatch: WatchStopHandle | null = null;
  let stopDataWatch: WatchStopHandle | null = null;
  let stopStatusWatch: WatchStopHandle | null = null;
  let closeConnection: (() => void) | null = null;
  let hasConnectivityListeners = false;

  const cleanupConnectivityListeners = () => {
    if (typeof window === 'undefined' || !hasConnectivityListeners) {
      return;
    }

    window.removeEventListener('online', handleBrowserOnline);
    window.removeEventListener('offline', handleBrowserOffline);
    hasConnectivityListeners = false;
  };

  const cleanupConnection = () => {
    isConnectingOrOpen.value = false;
    closeConnection = null;

    if (stopUserLoggedInWatch) {
      stopUserLoggedInWatch();
      stopUserLoggedInWatch = null;
    }
    if (stopDataWatch) {
      stopDataWatch();
      stopDataWatch = null;
    }
    if (stopStatusWatch) {
      stopStatusWatch();
      stopStatusWatch = null;
    }
  };

  function handleBrowserOnline() {
    if (!userLoggedIn.value) {
      return;
    }

    debugLog('browser online: retrying websocket connection');
    window.setTimeout(() => {
      void webSocketHandler();
    }, 0);
  }

  function handleBrowserOffline() {
    debugLog('browser offline: closing websocket connection');
    closeConnection?.();
    cleanupConnection();
  }

  const ensureConnectivityListeners = () => {
    if (typeof window === 'undefined' || hasConnectivityListeners) {
      return;
    }

    window.addEventListener('online', handleBrowserOnline);
    window.addEventListener('offline', handleBrowserOffline);
    hasConnectivityListeners = true;
  };

  const handleInternalMessage = (notification: INotification) => {
    switch (notification.data.obj) {
      case 'profile':
        repositoryProfiles.updateNotificationData(notification);
        break;
      case 'transaction':
      case 'wallet':
        repositoryWallet.updateNotificationData(notification);
        break;
      case 'investment':
      case 'investment_investment':
        repositoryInvestment.updateNotificationData(notification);
        break;
      case 'offer':
        repositoryOffer.updateNotificationData(notification);
        break;
      case 'filer':
        repositoryFiler.updateNotificationData(notification);
        break;
      case 'evm_transfer':
      case 'evm_contract':
        repositoryEvm.updateNotificationData(notification);
        break;
      default:
        // Optionally handle unknown types
        break;
    }
  };

  const handleMessage = (data: string) => {
    if (!data) return;
    debugLog(`ws message: ${data}`);
    if (data === 'pong') return;
    repositoryNotifications.updateNotificationsData(data);
    try {
      const notification = JSON.parse(data) as INotification;
      if (notification.type === 'internal') handleInternalMessage(notification);
    } catch (e) {
      console.error('Failed to parse WebSocket message:', e);
    }
  };

  const webSocketHandler = async (): Promise<void> => {
    debugLog('webSocketHandler called');
    if (!userLoggedIn.value) {
      cleanupConnectivityListeners();
      return;
    }

    if (isConnectingOrOpen.value) {
      debugLog('webSocketHandler skipped: connection already active');
      return;
    }

    ensureConnectivityListeners();

    if (isBrowserOffline()) {
      debugLog('webSocketHandler skipped: browser offline');
      return;
    }

    const url = `${NOTIFICATION_URL}/ws`;
    // Support both http and https
    const uri = url.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');

    debugLog(`connection to ${uri}`);

    isConnectingOrOpen.value = true;

    const { useToast } = await import('UiKit/components/Base/VToast/use-toast');
    const { toast } = useToast();
    const { data, close, status } = useWebSocket(uri, {
      autoClose: true,
      autoReconnect: {
        retries: 3,
        delay: 1000,
        onFailed() {
          cleanupConnection();
          if (isBrowserOffline()) {
            debugLog('websocket reconnect retries exhausted while offline');
            return;
          }
          toast(TOAST_OPTIONS);
        },
      },
      heartbeat: {
        message: '{"Command": "ping"}',
        interval: 60000,
        pongTimeout: 1000,
      },
    });
    closeConnection = close;

    stopUserLoggedInWatch = watch(userLoggedIn, () => {
      if (!userLoggedIn.value) {
        close();
        debugLog(`connection to ${uri} is closed`);
        cleanupConnection();
        cleanupConnectivityListeners();
      }
    });

    stopDataWatch = watch(
      () => data.value,
      (val) => {
        if (val) handleMessage(val);
      },
      { deep: true },
    );
    stopStatusWatch = watch(
      () => status.value,
      () => {
        debugLog(`websocket status: ${status.value}`);
        if (status.value === 'CLOSED') {
          cleanupConnection();
        }
      },
    );
  };

  return {
    webSocketHandler,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDomainWebSocketStore, import.meta.hot));
}
