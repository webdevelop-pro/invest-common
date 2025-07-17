import { watch } from 'vue';
import { INotification } from 'InvestCommon/data/notifications/notifications.types';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { useWebSocket } from '@vueuse/core';
import env from 'InvestCommon/global/index';
import { useToast } from 'UiKit/components/Base/VToast/use-toast';
import { useRepositoryNotifications } from 'InvestCommon/data/notifications/notifications.repository';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { useProfileWalletStore } from 'InvestCommon/store/useProfileWallet/useProfileWallet';
import { useProfileWalletTransactionStore } from 'InvestCommon/store/useProfileWallet/useProfileWalletTransaction';
import { useInvestmentsStore } from 'InvestCommon/store/useInvestments';
import { useOfferStore } from 'InvestCommon/store/useOffer';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';

const { NOTIFICATION_URL } = env;

const { toast } = useToast();

const TOAST_OPTIONS = {
  title: 'Failed to connect WebSocket after 3 retries',
  variant: 'error',
};

export const useDomainWebSocketStore = defineStore('domainWebsockets', () => {
  const userSessionStore = useSessionStore();
  const { userLoggedIn } = storeToRefs(userSessionStore);

  const handleInternalMessage = (notification: INotification) => {
    if (notification.data.obj === 'profile') useRepositoryProfiles().updateNotificationData(notification);
    if (notification.data.obj === 'wallet') useProfileWalletStore().updateNotificationData(notification);
    if (notification.data.obj === 'transaction') useProfileWalletTransactionStore().updateNotificationData(notification);
    if (notification.data.obj === 'investment') {
      useInvestmentsStore().updateNotificationData(notification);
      useOfferStore().updateNotificationData(notification);
    }
    if (notification.data.obj === 'offer') {
      useOfferStore().updateNotificationData(notification);
    }
  };

  const handleMessage = (data: string) => {
    console.log(`ws message: ${data}`);
    if (data === 'pong') return;
    useRepositoryNotifications().updateNotificationsData(data);
    const notification = JSON.parse(data) as INotification;
    if (notification.type === 'internal') handleInternalMessage(notification);
  };

  const webSocketHandler = async () => {
    if (!userLoggedIn.value) {
      return;
    }
    const url = `${NOTIFICATION_URL}/ws`;
    const uri = url.replace('https', 'wss');

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

    watch(userLoggedIn, () => {
      if (!userLoggedIn.value) {
        close();

        console.log(`connection to ${uri} is closed`);
      }
    });

    watch(() => data.value, () => {
      handleMessage(data.value);
    }, { deep: true });
    watch(() => status.value, () => {
      console.log(`websocket status: ${status.value}`);
    }, { deep: true });
  };

  return {
    webSocketHandler,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDomainWebSocketStore, import.meta.hot));
}
