import { ref, watch, type WatchStopHandle } from 'vue';
import { INotification } from 'InvestCommon/data/notifications/notifications.types';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { useWebSocket } from '@vueuse/core';
import env from 'InvestCommon/domain/config/env';
import { useToast } from 'UiKit/components/Base/VToast/use-toast';
import { useRepositoryNotifications } from 'InvestCommon/data/notifications/notifications.repository';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useRepositoryWallet } from 'InvestCommon/data/wallet/wallet.repository';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import { useRepositoryOffer } from 'InvestCommon/data/offer/offer.repository';
import { useRepositoryFiler } from 'InvestCommon/data/filer/filer.repository';
import { useRepositoryEvm } from 'InvestCommon/data/evm/evm.repository';

const { NOTIFICATION_URL } = env;

const { toast } = useToast();

const TOAST_OPTIONS = {
  title: 'Failed to connect WebSocket after 3 retries',
  variant: 'error',
};

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
  const isInitialized = ref(false);
  const stopHandlers = ref<WatchStopHandle[]>([]);
  const closeActiveConnection = ref<null | (() => void)>(null);

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
    console.log(`ws message: ${data}`);
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
    console.log('webSocketHandler called');
    if (!userLoggedIn.value) {
      return;
    }
    if (isInitialized.value) {
      return;
    }
    isInitialized.value = true;

    const cleanup = () => {
      stopHandlers.value.forEach((stop) => stop());
      stopHandlers.value = [];
      closeActiveConnection.value = null;
      isInitialized.value = false;
    };

    const url = `${NOTIFICATION_URL}/ws`;
    // Support both http and https
    const uri = url.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');

    console.log(`connection to ${uri}`);
    const { data, close, status } = useWebSocket(uri, {
      autoClose: true,
      autoReconnect: {
        retries: 3,
        delay: 1000,
        onFailed() {
          toast(TOAST_OPTIONS);
        },
      },
      heartbeat: {
        message: '{"Command": "ping"}',
        interval: 60000,
        pongTimeout: 1000,
      },
    });
    closeActiveConnection.value = close;

    const stopUserWatch = watch(userLoggedIn, () => {
      if (!userLoggedIn.value) {
        close();
        cleanup();
        console.log(`connection to ${uri} is closed`);
      }
    });

    const stopDataWatch = watch(
      () => data.value,
      (val) => {
        if (val) handleMessage(val);
      },
      { deep: true },
    );
    const stopStatusWatch = watch(
      () => status.value,
      () => {
        console.log(`websocket status: ${status.value}`);
      },
    );

    stopHandlers.value = [stopUserWatch, stopDataWatch, stopStatusWatch];
  };

  const disconnect = () => {
    if (closeActiveConnection.value) {
      closeActiveConnection.value();
    }
    stopHandlers.value.forEach((stop) => stop());
    stopHandlers.value = [];
    closeActiveConnection.value = null;
    isInitialized.value = false;
  };

  return {
    webSocketHandler,
    disconnect,
    isInitialized,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDomainWebSocketStore, import.meta.hot));
}
