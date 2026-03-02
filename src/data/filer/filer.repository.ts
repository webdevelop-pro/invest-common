import { acceptHMRUpdate, defineStore } from 'pinia';
import { ApiClient } from 'InvestCommon/data/service/apiClient';
import env from 'InvestCommon/domain/config/env';
import { IFilerItem, IPostSignurlResponse } from 'InvestCommon/data/filer/filer.type';
import { createRepositoryStates, withActionState } from 'InvestCommon/data/repository/repository';
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

type FilerStates = {
  getFilesState: IFilerItem[];
  getPublicFilesState: IFilerItem[];
  postSignurlState: IPostSignurlResponse;
  uploadFileState: string;
  getFileByIdLinkState: IFilerItem[];
  notificationFieldsState: INotification['data']['fields'];
};

export const useRepositoryFiler = defineStore('repository-filer', () => {
  const apiClient = new ApiClient(FILER_URL);

  const {
    getFilesState,
    getPublicFilesState,
    postSignurlState,
    uploadFileState,
    getFileByIdLinkState,
    notificationFieldsState,
    resetAll,
  } = createRepositoryStates<FilerStates>({
    getFilesState: undefined,
    getPublicFilesState: undefined,
    postSignurlState: undefined,
    uploadFileState: undefined,
    getFileByIdLinkState: undefined,
    notificationFieldsState: undefined,
  });

  // Actions
  const getFiles = async (object_id: number | string, object_name: string) =>
    withActionState(getFilesState, async () => {
      const response = await apiClient.get<IFilerItem[]>(`/auth/objects/${object_name}/${object_id}`);
      return response.data;
    });

  const getPublicFiles = async (object_id: number | string, object_name: string) =>
    withActionState(getPublicFilesState, async () => {
      const response = await apiClient.get<IFilerItem[]>(`/public/objects/${object_name}/${object_id}`);
      return response.data;
    });

  const postSignurl = async (body: object) =>
    withActionState(postSignurlState, async () => {
      const response = await apiClient.post<any>('/auth/files/signurl', body, {
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      return response.data;
    });

  const uploadFile = async (file: File, type: string, uploadData: { url: string; fileId: string }) =>
    withActionState(uploadFileState, async () => {
      const result = await uploadFileXHR(file, type, uploadData);
      return result;
    });

  const getFileByIdLink = async (id: number | string, size?: string) =>
    withActionState(getFileByIdLinkState, async () => {
      const url = size ? `/auth/files/${id}?size=${size}` : `/auth/files/${id}`;
      const response = await apiClient.get<IFilerItem[]>(url);
      return response.data;
    });

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
    if (postSignurlState.value.data?.url && postSignurlState.value.data?.meta?.id) {
      const uploadData = {
        objectName,
        objectId,
        userId,
        url: postSignurlState.value.data.url,
        fileId: postSignurlState.value.data.meta.id,
      };
      await uploadFile(file, file.type, uploadData);
    }
    if (uploadFileState.value.error) {
      return false;
    }
    return true;
  };

  const updateNotificationData = (notification: INotification) => {
    if (!notification?.data) return;
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
