import { ref, computed } from 'vue';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { ApiClient } from 'InvestCommon/data/service/apiClient';
import env from 'InvestCommon/domain/config/env';
import { INotification } from './notifications.types';
import { createRepositoryStates, withActionState } from 'InvestCommon/data/repository/repository';
import { NotificationFormatter } from './notifications.formatter';

type NotificationStates = {
  getAllState: INotification[];
  markAllAsReadState: void;
  markAsReadByIdState: void;
};

export const useRepositoryNotifications = defineStore('repository-notifications', () => {
  const apiClient = new ApiClient(env.NOTIFICATION_URL);

  // State
  const notifications = ref<INotification[]>([]);
  const formattedNotifications = computed(() => (
    notifications.value.map((notification: INotification) => new NotificationFormatter(notification).format()) || []));

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
      notifications.value = data;
      return data;
    });
    return result ?? [];
  };

  const markAllAsRead = async () =>
    withActionState(markAllAsReadState, async () => {
      await apiClient.put(`/notification/all`, undefined, {
        showGlobalAlertOnServerError: false,
      });
      notifications.value = notifications.value.map((notification: INotification) => ({
        ...notification,
        status: 'read',
      }));
    });

  const markAsReadById = async (id: number) =>
    withActionState(markAsReadByIdState, async () => {
      await apiClient.put(`/notification/${id}`, undefined, {
        showGlobalAlertOnServerError: false,
      });
      notifications.value = notifications.value.map((notification: INotification) => (notification.id === id
        ? { ...notification, status: 'read' }
        : notification));
    });

  const resetAll = () => {
    notifications.value = [];
    resetActionStates();
  };

  /** Alias for resetAll; use resetAll for consistency. */
  const reset = () => resetAll();

  const updateNotificationsData = (data: string) => {
    const notification = JSON.parse(data) as INotification;
    notifications.value.unshift(notification);
  };

  return {
    // State
    notifications,
    formattedNotifications,
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
