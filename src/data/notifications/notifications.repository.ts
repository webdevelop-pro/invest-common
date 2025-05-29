import { ref, computed } from 'vue';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { ApiClient } from 'UiKit/helpers/api/apiClient';
import env from 'InvestCommon/global';
import { INotification } from 'InvestCommon/types/api/notifications';
import { toasterErrorHandling } from 'UiKit/helpers/api/toasterErrorHandling';
import { NotificationFormatter } from './notifications.formatter';

export const useRepositoryNotifications = defineStore('repository-notifications', () => {
  // Dependencies
  const apiClient = new ApiClient();
  const baseUrl = env.NOTIFICATION_URL;

  // State
  const notifications = ref<INotification[]>([]);
  const formattedNotifications = computed(() => (
    notifications.value.map((notification: INotification) => new NotificationFormatter(notification).format()) || []));
  const isLoadingGetAll = ref(false);
  const isLoadingMarkAll = ref(false);
  const isLoadingMarkById = ref(false);
  const error = ref<Error | null>(null);

  // Actions
  const getAll = async () => {
    try {
      isLoadingGetAll.value = true;
      error.value = null;
      const response = await apiClient.get<INotification[]>(`${baseUrl}/notification`);
      notifications.value = response.data;
      return notifications.value;
    } catch (err) {
      error.value = err as Error;
      toasterErrorHandling(err, 'Failed to fetch notifications');
      throw err;
    } finally {
      isLoadingGetAll.value = false;
    }
  };

  const markAllAsRead = async () => {
    try {
      isLoadingMarkAll.value = true;
      error.value = null;
      await apiClient.put(`${baseUrl}/notification/all`);
      notifications.value = notifications.value.map((notification: INotification) => ({
        ...notification,
        status: 'read',
      }));
    } catch (err) {
      error.value = err as Error;
      toasterErrorHandling(err, 'Failed to mark all notifications as read');
      throw err;
    } finally {
      isLoadingMarkAll.value = false;
    }
  };

  const markAsReadById = async (id: number) => {
    try {
      isLoadingMarkById.value = true;
      error.value = null;
      await apiClient.put(`${baseUrl}/notification/${id}`);
      notifications.value = notifications.value.map((notification: INotification) => (notification.id === id
        ? { ...notification, status: 'read' }
        : notification));
    } catch (err) {
      error.value = err as Error;
      toasterErrorHandling(err, 'Failed to mark notification as read');
      throw err;
    } finally {
      isLoadingMarkById.value = false;
    }
  };

  return {
    // State
    notifications,
    formattedNotifications,
    isLoadingGetAll,
    isLoadingMarkAll,
    isLoadingMarkById,
    error,
    // Actions
    getAll,
    markAllAsRead,
    markAsReadById,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRepositoryNotifications, import.meta.hot));
}
