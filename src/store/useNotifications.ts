import { ref, computed, watch } from 'vue';
import { INotification } from 'InvestCommon/types/api/notifications';
import {
  fetchGetNotificationsAll, fetchMarkNotificationReadAll, fetchMarkNotificationReadById,
} from 'InvestCommon/services/api/notifications';
import { generalErrorHandling } from 'InvestCommon/helpers/generalErrorHandling';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { useUsersStore } from './useUsers';
import { useProfileWalletStore } from './useProfileWallet/useProfileWallet';
import { useProfileWalletTransactionStore } from './useProfileWallet/useProfileWalletTransaction';
import { useInvestmentsStore } from './useInvestments';
import { useOfferStore } from './useOffer';
import { useWebSocket } from '@vueuse/core';
import env from 'InvestCommon/global/index';
import { notify } from '@kyvg/vue3-notification';

const { NOTIFICATION_URL } = env;
const ERROR_OPTIONS_RETRY = {
  text: 'Failed to connect WebSocket after 3 retries',
  data: {
    status: 3,
  },
  type: 'error',
  group: 'transaction',
  duration: 10000,
};

export const useNotificationsStore = defineStore('notifications', () => {
  const usersStore = useUsersStore();
  const { userLoggedIn } = storeToRefs(usersStore);

  const isGetNotificationsLoading = ref(false);
  const isGetNotificationsError = ref(false);
  const getNotificationsData = ref<INotification[]>([]);
  const getNotificationsAll = async () => {
    getNotificationsData.value = [];
    isGetNotificationsLoading.value = true;
    isGetNotificationsError.value = false;
    const response = await fetchGetNotificationsAll().catch((error: Response) => {
      isGetNotificationsError.value = true;
      void generalErrorHandling(error);
    });
    if (response) {
      getNotificationsData.value = response;
    }
    isGetNotificationsLoading.value = false;
  };

  const isMarkAllAsReadLoading = ref(false);
  const isMarkAllAsReadError = ref(false);
  const markAllAsReadData = ref();
  const markAllAsRead = async () => {
    markAllAsReadData.value = undefined;
    isMarkAllAsReadLoading.value = true;
    isMarkAllAsReadError.value = false;
    const response = await fetchMarkNotificationReadAll().catch((error: Response) => {
      isMarkAllAsReadError.value = true;
      void generalErrorHandling(error);
    });
    if (response) {
      markAllAsReadData.value = response;
    }
    isMarkAllAsReadLoading.value = false;
  };

  const isMarkAsReadByIdLoading = ref(false);
  const isMarkAsReadByIdError = ref(false);
  const markAsReadByIdData = ref();
  const markAsReadById = async (notification_id: number) => {
    markAsReadByIdData.value = undefined;
    isMarkAsReadByIdLoading.value = true;
    isMarkAsReadByIdError.value = false;
    const response = await fetchMarkNotificationReadById(notification_id).catch((error: Response) => {
      isMarkAsReadByIdError.value = true;
      void generalErrorHandling(error);
    });
    if (response) {
      markAsReadByIdData.value = response;
    }
    isMarkAsReadByIdLoading.value = false;
  };

  const updateNotificationsData = (data: string) => {
    const notification = JSON.parse(data) as INotification;
    getNotificationsData.value.unshift(notification);
  };

  const isNotificationSidebarOpen = ref(false);
  const notificationSidebarOpen = () => {
    isNotificationSidebarOpen.value = true;
    document.body.classList.add('is-notification-sidebar-open');
  };

  const notificationSidebarClose = () => {
    isNotificationSidebarOpen.value = false;
    document.body.classList.remove('is-notification-sidebar-open');
  };

  const handleInternalMessage = (notification: INotification) => {
    if (notification.data.obj === 'profile') useUsersStore().updateData(notification);
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

  const setNotificationAsRead = (notificationId: number) => {
    const notification = getNotificationsData.value.find((item) => item.id === notificationId);
    if (notification) notification.status = 'read';
  };

  const handleMessage = (data: string) => {
    if (data === 'pong') return;
    updateNotificationsData(data);
    const notification = JSON.parse(data) as INotification;
    if (notification.type === 'internal') handleInternalMessage(notification);
  };

  const notificationLength = computed(() => getNotificationsData.value.length);
  const notificationUserData = computed(() => getNotificationsData.value.filter((item) => item.type !== 'internal'));
  const notificationUserLength = computed(() => notificationUserData.value.length);
  const getNotificationsUnreadData = computed(() => notificationUserData.value.filter((item) => item.status === 'unread'));
  const notificationUnreadLength = computed(() => getNotificationsUnreadData.value.length);

  const notificationsHandler = async () => {
    await getNotificationsAll();
    const url = `${NOTIFICATION_URL}/ws`;
    const uri = url.replace('https', 'wss');

    // eslint-disable-next-line no-console
    console.log(`connection to ${uri}`);
    const { data, close } = useWebSocket(uri, {
      autoReconnect: {
        retries: 3,
        delay: 1000,
        onFailed() {
          notify(ERROR_OPTIONS_RETRY);
        },
      },
      heartbeat: {
        message: '{"Command": "ping"}',
        interval: 60000,
        pongTimeout: 1000,
      },
    });

    watch(() => userLoggedIn.value, (value) => {
      if (!value) {
        close();
        // eslint-disable-next-line no-console
        console.log(`connection to ${uri} is closed`);
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    watch(() => data.value, () => {
      // eslint-disable-next-line
      handleMessage(data.value);
    }, { deep: true });
  };

  const resetAll = () => {
    getNotificationsData.value = [];
    markAllAsReadData.value = undefined;
    markAsReadByIdData.value = undefined;
  };

  return {
    getNotificationsAll,
    updateNotificationsData,
    notificationSidebarOpen,
    notificationSidebarClose,
    notificationLength,
    isNotificationSidebarOpen,
    isGetNotificationsLoading,
    isGetNotificationsError,
    getNotificationsData,
    getNotificationsUnreadData,
    notificationUnreadLength,
    notificationUserLength,
    notificationUserData,
    resetAll,
    handleMessage,
    markAllAsRead,
    isMarkAllAsReadLoading,
    isMarkAllAsReadError,
    markAllAsReadData,
    markAsReadById,
    isMarkAsReadByIdLoading,
    isMarkAsReadByIdError,
    markAsReadByIdData,
    notificationsHandler,
    setNotificationAsRead,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useNotificationsStore, import.meta.hot));
}
