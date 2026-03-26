import { computed, ref } from 'vue';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { ApiClient } from 'InvestCommon/data/service/apiClient';
import env from 'InvestCommon/config/env';
import { IFormattedNotification, INotification } from './notifications.types';
import {
  applyOfflineHydrationMeta,
  createRepositoryStates,
  withActionState,
} from 'InvestCommon/data/repository/repository';
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

  const updateRawNotificationState = (updater: (items: INotification[]) => INotification[]) => {
    const current = getAllState.value.data ?? [];
    getAllState.value.data = updater(current);
  };

  const states = createRepositoryStates<NotificationStates>({
    getAllState: undefined,
    markAllAsReadState: undefined,
    markAsReadByIdState: undefined,
  });
  const { getAllState, markAllAsReadState, markAsReadByIdState, resetAll: resetActionStates } = states;

  // Actions
  const getAll = async (): Promise<INotification[]> => {
    let responseHeaders: Headers | null = null;
    const result = await withActionState(getAllState, async () => {
      const response = await apiClient.get<INotification[]>(`/notification`, {
        showGlobalAlertOnServerError: false,
      });
      responseHeaders = response.headers;
      const data = response.data ?? [];
      notificationCache.prune(data);
      setFormattedNotifications(data);
      return data;
    });
    if (responseHeaders) {
      applyOfflineHydrationMeta(getAllState, responseHeaders);
    }
    return result ?? [];
  };

  const markAllAsRead = async () =>
    withActionState(markAllAsReadState, async () => {
      await apiClient.put(`/notification/all`, undefined, {
        showGlobalAlertOnServerError: false,
      });
      updateRawNotificationState((items) => items.map((notification) => ({
        ...notification,
        status: 'read',
      })));
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
      updateRawNotificationState((items) => items.map((notification) => (
        notification.id === id
          ? { ...notification, status: 'read' }
          : notification
      )));
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
    let notification: INotification;

    try {
      notification = JSON.parse(data) as INotification;
    } catch {
      return;
    }

    const formatted = notificationCache.format(notification);
    const existingIndex = formattedNotifications.value.findIndex((item) => item.id === formatted.id);
    updateRawNotificationState((items) => {
      const rawIndex = items.findIndex((item) => item.id === notification.id);

      if (rawIndex === -1) {
        return [notification, ...items];
      }

      const next = [...items];
      next.splice(rawIndex, 1);
      return [notification, ...next];
    });

    if (existingIndex === -1) {
      formattedNotifications.value = [formatted, ...formattedNotifications.value];
      return;
    }

    const next = [...formattedNotifications.value];
    next.splice(existingIndex, 1);
    formattedNotifications.value = [formatted, ...next];
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
