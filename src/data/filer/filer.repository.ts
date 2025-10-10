import { acceptHMRUpdate, defineStore } from 'pinia';
import { ApiClient } from 'InvestCommon/data/service/apiClient';
import env from 'InvestCommon/domain/config/env';
import { IFilerItem } from 'InvestCommon/types/api/filer.type';
import { toasterErrorHandling } from 'InvestCommon/data/repository/error/toasterErrorHandling';
import { createActionState } from 'InvestCommon/data/repository/repository';
import { INotification } from 'InvestCommon/data/notifications/notifications.types';

const { FILER_URL } = env;

// Helper for direct file upload (PUT with custom headers)
function uploadFileXHR(file: File, type: string, uploadData: { url: string; fileId: string }) {
  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadData.url, true);
    xhr.setRequestHeader('Content-Type', type);
    xhr.setRequestHeader('x-goog-meta-file-id', uploadData.fileId);
    xhr.send(file);
    xhr.onload = function () {
      if (xhr.status === 200) {
        resolve('success');
      } else {
        reject(new Error('failed'));
      }
    };
    xhr.onerror = function () {
      reject(new Error('failed'));
    };
  });
}

export const useRepositoryFiler = defineStore('repository-filer', () => {
  const apiClient = new ApiClient(FILER_URL);

  // States
  const getFilesState = createActionState<IFilerItem[]>();
  const getPublicFilesState = createActionState<IFilerItem[]>();
  const postSignurlState = createActionState<any>();
  const uploadFileState = createActionState<string>();
  const getFileByIdLinkState = createActionState<IFilerItem[]>();
  const notificationFieldsState = createActionState<INotification['data']['fields']>();

  // Actions
  const getFiles = async (object_id: number | string, object_name: string) => {
    try {
      getFilesState.value.loading = true;
      getFilesState.value.error = null;
      const response = await apiClient.get<IFilerItem[]>(`/auth/objects/${object_name}/${object_id}`);
      getFilesState.value.data = response.data;
      return response.data;
    } catch (err) {
      getFilesState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to fetch files');
      throw err;
    } finally {
      getFilesState.value.loading = false;
    }
  };

  const getPublicFiles = async (object_id: number | string, object_name: string) => {
    try {
      getPublicFilesState.value.loading = true;
      getPublicFilesState.value.error = null;
      const response = await apiClient.get<IFilerItem[]>(`/public/objects/${object_name}/${object_id}`);
      getPublicFilesState.value.data = response.data;
      return response.data;
    } catch (err) {
      getPublicFilesState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to fetch public files');
      throw err;
    } finally {
      getPublicFilesState.value.loading = false;
    }
  };

  const postSignurl = async (body: object) => {
    try {
      postSignurlState.value.loading = true;
      postSignurlState.value.error = null;
      const response = await apiClient.post<any>('/auth/files/signurl', body, {
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      postSignurlState.value.data = response.data;
      return response.data;
    } catch (err) {
      postSignurlState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to get signurl');
      throw err;
    } finally {
      postSignurlState.value.loading = false;
    }
  };

  const uploadFile = async (file: File, type: string, uploadData: { url: string; fileId: string }) => {
    try {
      uploadFileState.value.loading = true;
      uploadFileState.value.error = null;
      const result = await uploadFileXHR(file, type, uploadData);
      uploadFileState.value.data = result;
      return result;
    } catch (err) {
      uploadFileState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to upload file');
      throw err;
    } finally {
      uploadFileState.value.loading = false;
    }
  };

  const getFileByIdLink = async (id: number | string, size?: string) => {
    try {
      getFileByIdLinkState.value.loading = true;
      getFileByIdLinkState.value.error = null;
      
      // Only include size parameter if it's explicitly provided
      const url = size ? `/auth/files/${id}?size=${size}` : `/auth/files/${id}`;
      const response = await apiClient.get<IFilerItem[]>(url);
      getFileByIdLinkState.value.data = response;
      return response.data;
    } catch (err) {
      getFileByIdLinkState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to fetch image by id');
      throw err;
    } finally {
      getFileByIdLinkState.value.loading = false;
    }
  };

  const uploadHandler = async (file: File, objectId: string | number, objectName: string | number, userId: number) => {
    await postSignurl({
      filename: file.name,
      mime: file.type,
      user_id: userId,
      path: `/${objectName}/${objectId}`,
    });
    if (postSignurlState.value.error) {
      return false;
    }
    if (postSignurlState.value.data?.url) {
      const uploadData = {
        objectName,
        objectId,
        userId,
        url: postSignurlState.value.data?.url,
        fileId: postSignurlState.value.data?.meta?.id,
      };
      await uploadFile(file, file.type, uploadData);
    }
    if (uploadFileState.value.error) {
      return false;
    }
    return true;
  };

  const updateNotificationData = (notification: INotification) => {
    const { fields } = notification.data;
    const objectId = fields?.object_id;
    
    if (!fields || objectId === undefined) return;
    
    // Store notification fields in state for access from other parts
    notificationFieldsState.value.data = fields;
    notificationFieldsState.value.error = null;
    
    const updateStateArray = (stateArray: IFilerItem[] | undefined) => {
      if (!stateArray) return;
      const index = stateArray.findIndex((item) => item.id === objectId);
      if (index !== -1) {
        Object.assign(stateArray[index], fields);
      }
    };
    
    updateStateArray(getFilesState.value.data);
    updateStateArray(getPublicFilesState.value.data);
    updateStateArray(getFileByIdLinkState.value.data);
  };

  const resetAll = () => {
    getFilesState.value = { loading: false, error: null, data: undefined };
    getPublicFilesState.value = { loading: false, error: null, data: undefined };
    postSignurlState.value = { loading: false, error: null, data: undefined };
    uploadFileState.value = { loading: false, error: null, data: undefined };
    getFileByIdLinkState.value = { loading: false, error: null, data: undefined };
    notificationFieldsState.value = { loading: false, error: null, data: undefined };
  };

  return {
    // States
    getFilesState,
    getPublicFilesState,
    postSignurlState,
    uploadFileState,
    getFileByIdLinkState,
    notificationFieldsState,
    // Actions
    getFiles,
    getPublicFiles,
    postSignurl,
    uploadFile,
    getFileByIdLink,
    resetAll,
    uploadHandler,
    updateNotificationData,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRepositoryFiler, import.meta.hot));
}
