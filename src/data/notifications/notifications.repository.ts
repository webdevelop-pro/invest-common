import { computed, ref } from 'vue';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { ApiClient } from 'InvestCommon/data/service/apiClient';
import env from 'InvestCommon/config/env';
import { IFormattedNotification, INotification } from './notifications.types';
import { createRepositoryStates, withActionState } from 'InvestCommon/data/repository/repository';
import { NotificationFormatter } from './notifications.formatter';
import { createFormatterCache } from 'InvestCommon/data/repository/formatterCache';

type NotificationStates = {
  getAllState: INotification[];
  markAllAsReadState: void;
  markAsReadByIdState: void;
};

export const useRepositoryNotifications = defineStore('repository-notifications', () => {
  const apiClient = new ApiClient(env.NOTIFICATION_URL);

  // State
  const formattedNotifications = ref<IFormattedNotification[]>([]);
  const unreadNotificationsCount = computed(() => {
    const source = formattedNotifications.value;
    let count = 0;
    for (let i = 0; i < source.length; i++) {
      const item = source[i];
      if (item.status === 'unread' && item.type !== 'internal') {
        count++;
      }
    }
    return count;
  });
  const notificationCache = createFormatterCache<INotification, IFormattedNotification>({
    getKey: (notification) => notification.id,
    getSignature: (notification) => [
      notification.updated_at,
      notification.status,
      notification.type,
      notification.content,
      JSON.stringify(notification.data?.fields ?? {}),
    ].join('|'),
    format: (notification) => new NotificationFormatter(notification).format(),
  });

  const setFormattedNotifications = (items: INotification[]) => {
    formattedNotifications.value = notificationCache.formatMany(items);
  };

  const states = createRepositoryStates<NotificationStates>({
    getAllState: undefined,
    markAllAsReadState: undefined,
    markAsReadByIdState: undefined,
  });
  const { getAllState, markAllAsReadState, markAsReadByIdState, resetAll: resetActionStates } = states;

  // Actions
  const getAll = async (): Promise<INotification[]> => {
    const result = await withActionState(getAllState, async () => {
      const response = await apiClient.get<INotification[]>(`/notification`, {
        showGlobalAlertOnServerError: false,
      });
      const data = response.data ?? [];
      notificationCache.prune(data);
      setFormattedNotifications(data);
      return data;
    });
    return result ?? [];
  };

  const markAllAsRead = async () =>
    withActionState(markAllAsReadState, async () => {
      await apiClient.put(`/notification/all`, undefined, {
        showGlobalAlertOnServerError: false,
      });
      formattedNotifications.value = formattedNotifications.value.map((notification) => ({
        ...notification,
        status: 'read',
        isUnread: false,
      }));
    });

  const markAsReadById = async (id: number) =>
    withActionState(markAsReadByIdState, async () => {
      await apiClient.put(`/notification/${id}`, undefined, {
        showGlobalAlertOnServerError: false,
      });
      formattedNotifications.value = formattedNotifications.value.map((notification) => (notification.id === id
        ? { ...notification, status: 'read', isUnread: false }
        : notification));
    });

  const resetAll = () => {
    formattedNotifications.value = [];
    notificationCache.clear();
    resetActionStates();
  };

  /** Alias for resetAll; use resetAll for consistency. */
  const reset = () => resetAll();

  const updateNotificationsData = (data: string) => {
    const notification = JSON.parse(data) as INotification;
    formattedNotifications.value.unshift(notificationCache.format(notification));
  };

  return {
    // State
    formattedNotifications,
    unreadNotificationsCount,
    // Action states
    getAllState,
    markAllAsReadState,
    markAsReadByIdState,
    // Actions
    getAll,
    markAllAsRead,
    markAsReadById,
    updateNotificationsData,
    reset,
    resetAll,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRepositoryNotifications, import.meta.hot));
}
