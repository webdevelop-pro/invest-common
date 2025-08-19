import { ref, computed } from 'vue';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { ApiClient } from 'InvestCommon/data/service/apiClient';
import env from 'InvestCommon/global';
import { INotification } from 'InvestCommon/types/api/notifications';
import { globalErrorHandling } from 'InvestCommon/data/repository/error/globalErrorHandling';
import { createActionState } from 'InvestCommon/data/repository/repository';
import { NotificationFormatter } from './notifications.formatter';

export const useRepositoryNotifications = defineStore('repository-notifications', () => {
  // Dependencies
  const apiClient = new ApiClient();
  const baseUrl = env.NOTIFICATION_URL;

  // State
  const notifications = ref<INotification[]>([]);
  const formattedNotifications = computed(() => (
    notifications.value.map((notification: INotification) => new NotificationFormatter(notification).format()) || []));

  // Action states
  const getAllState = createActionState<INotification[]>();
  const markAllAsReadState = createActionState<void>();
  const markAsReadByIdState = createActionState<void>();

  // Actions
  const getAll = async () => {
    try {
      getAllState.value.loading = true;
      getAllState.value.error = null;
      const response = await apiClient.get<INotification[]>(`${baseUrl}/notification`);
      notifications.value = response.data;
      getAllState.value.data = response.data;
      return getAllState.value.data;
    } catch (err) {
      getAllState.value.error = err as Error;
      globalErrorHandling(err, 'Failed to fetch notifications');
      throw err;
    } finally {
      getAllState.value.loading = false;
    }
  };

  const markAllAsRead = async () => {
    try {
      markAllAsReadState.value.loading = true;
      markAllAsReadState.value.error = null;
      await apiClient.put(`${baseUrl}/notification/all`);
      notifications.value = notifications.value.map((notification: INotification) => ({
        ...notification,
        status: 'read',
      }));
      markAllAsReadState.value.data = undefined;
    } catch (err) {
      markAllAsReadState.value.error = err as Error;
      globalErrorHandling(err, 'Failed to mark all notifications as read');
      throw err;
    } finally {
      markAllAsReadState.value.loading = false;
    }
  };

  const markAsReadById = async (id: number) => {
    try {
      markAsReadByIdState.value.loading = true;
      markAsReadByIdState.value.error = null;
      await apiClient.put(`${baseUrl}/notification/${id}`);
      notifications.value = notifications.value.map((notification: INotification) => (notification.id === id
        ? { ...notification, status: 'read' }
        : notification));
      markAsReadByIdState.value.data = undefined;
    } catch (err) {
      markAsReadByIdState.value.error = err as Error;
      globalErrorHandling(err, 'Failed to mark notification as read');
      throw err;
    } finally {
      markAsReadByIdState.value.loading = false;
    }
  };

  const resetAll = () => {
    notifications.value = [];
    // Reset all action states explicitly
    getAllState.value = { loading: false, error: null, data: null };
    markAllAsReadState.value = { loading: false, error: null, data: null };
    markAsReadByIdState.value = { loading: false, error: null, data: null };
  };

  const reset = () => {
    notifications.value = [];
    // Reset all action states
    Object.values({
      getAllState,
      markAllAsReadState,
      markAsReadByIdState,
    }).forEach((action) => {
      action.value.data = undefined;
      action.value.loading = false;
      action.value.error = null;
    });
  };

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
