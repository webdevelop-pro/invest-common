/* eslint-disable no-param-reassign */
import { computed, ref } from 'vue';
import { generalErrorHandling } from 'InvestCommon/helpers/generalErrorHandling';
import {
  fetchGetFiles, fetchGetPublicFiles, fetchPostSignurl, uploadFile,
} from 'InvestCommon/services/api/filer';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { IFilerItem } from 'InvestCommon/types/api/filer';
import { useUsersStore } from 'InvestCommon/store/useUsers';

export const useFilerStore = defineStore('filer', () => {
  const usersStore = useUsersStore();
  const { selectedUserProfileData } = storeToRefs(usersStore);

  const isGetFilesLoading = ref(false);
  const isGetFilesError = ref(false);
  const getFilesData = ref<IFilerItem[]>([]);
  const getFiles = async (object_id: number | string, object_name: string) => {
    isGetFilesLoading.value = true;
    isGetFilesError.value = false;
    const response = await fetchGetFiles(object_id, object_name).catch((error: Response) => {
      isGetFilesError.value = true;
      generalErrorHandling(error);
    });
    if (response) getFilesData.value = response;
    isGetFilesLoading.value = false;
    return getFilesData.value;
  };

  const getFilesDataDocuments = computed(() => getFilesData.value?.filter((item) => item['object-type'] !== 'media'));
  const getFilesDataMedia = computed(() => {
    const filtered = getFilesData.value?.filter((item) => item['object-type'] === 'media');
    return filtered.map((item) => {
      // Ensure that the URLs are properly prefixed if they don't include 'http'
      if (!item.meta_data?.big?.includes('http')) {
        item.meta_data.big = `https://webdevelop-us-media-thumbs.storage.googleapis.com${item.meta_data?.big}`;
      }
      if (!item.meta_data?.medium?.includes('http')) {
        item.meta_data.medium = `https://webdevelop-us-media-thumbs.storage.googleapis.com${item.meta_data?.medium}`;
      }
      if (!item.meta_data?.small?.includes('http')) {
        item.meta_data.small = `https://webdevelop-us-media-thumbs.storage.googleapis.com${item.meta_data?.small}`;
      }
      return item; // Return the modified item
    });
  });

  const isGetFilesPublicLoading = ref(false);
  const isGetFilesPublicError = ref(false);
  const getFilesPublicData = ref<IFilerItem[]>([]);
  const getFilesPublic = async (object_id: number | string, object_name: string) => {
    isGetFilesPublicLoading.value = true;
    isGetFilesPublicError.value = false;
    const response = await fetchGetPublicFiles(object_id, object_name).catch((error: Response) => {
      isGetFilesPublicError.value = true;
      generalErrorHandling(error);
    });
    if (response) getFilesPublicData.value = response;
    isGetFilesPublicLoading.value = false;
    return getFilesPublicData.value;
  };

  const getFilesDataPublicaDocuments = computed(() => getFilesPublicData.value?.filter((item: { [x: string]: string; }) => item['object-type'] !== 'media'));
  const getFilesDataPublicMedia = computed(() => {
    const filtered = getFilesPublicData.value?.filter((item: { [x: string]: string; }) => item['object-type'] === 'media');
    return filtered.map((item: { meta_data: { big: string | string[]; medium: string | string[]; small: string | string[]; }; }) => {
      // Ensure that the URLs are properly prefixed if they don't include 'http'
      if (!item.meta_data?.big?.includes('http')) {
        item.meta_data.big = `https://webdevelop-us-media-thumbs.storage.googleapis.com${item.meta_data?.big}`;
      }
      if (!item.meta_data?.medium?.includes('http')) {
        item.meta_data.medium = `https://webdevelop-us-media-thumbs.storage.googleapis.com${item.meta_data?.medium}`;
      }
      if (!item.meta_data?.small?.includes('http')) {
        item.meta_data.small = `https://webdevelop-us-media-thumbs.storage.googleapis.com${item.meta_data?.small}`;
      }
      return item; // Return the modified item
    });
  });

  const isPostSignurlLoading = ref(false);
  const postSignurlError = ref(false);
  const postSignurlData = ref<IFilerItem[]>([]);
  const postSignurl = async (body: object) => {
    isPostSignurlLoading.value = true;
    postSignurlError.value = false;
    const response = await fetchPostSignurl(body).catch(async (error: Response) => {
      postSignurlError.value = JSON.parse(await error.text());
      generalErrorHandling(error);
    });
    if (response) postSignurlData.value = response;
    isPostSignurlLoading.value = false;
    return postSignurlData.value;
  };

  const isUploadFIleLoading = ref(false);
  const uploadFIleError = ref(false);
  const uploadFIleData = ref<IFilerItem[]>([]);
  const uploadFIle = async (file: File, type: string, uploadData: object) => {
    isUploadFIleLoading.value = true;
    uploadFIleError.value = false;
    const response = await uploadFile(file, type, uploadData).catch(async (error: Response) => {
      uploadFIleError.value = JSON.parse(await error.text());
      generalErrorHandling(error);
    });
    if (response) uploadFIleData.value = response;
    isUploadFIleLoading.value = false;
    return uploadFIleData.value;
  };

  const uploadHandler = async (file: File, objectId: string | number, objectName: string | number) => {
    await postSignurl({
      filename: file.name,
      mime: file.type,
      user_id: Number(selectedUserProfileData.value?.user_id),
      path: `/${objectName}/${objectId}`,
    });
    if (postSignurlError.value) {
      return false;
    }
    if (postSignurlData.value?.url) {
      const uploadData = {
        objectName,
        objectId,
        userId: selectedUserProfileData.value?.user_id,
        url: postSignurlData.value?.url,
        fileId: postSignurlData.value?.meta?.id,
      };
      await uploadFIle(file, file.type, uploadData);
    }
    return true;
  };

  const resetAll = () => {
    getFilesData.value = [];
    getFilesPublicData.value = [];
    postSignurlData.value = [];
  };

  return {
    getFiles,
    isGetFilesLoading,
    isGetFilesError,
    getFilesData,
    getFilesDataMedia,
    getFilesDataDocuments,
    getFilesPublic,
    isGetFilesPublicLoading,
    isGetFilesPublicError,
    getFilesPublicData,
    getFilesDataPublicaDocuments,
    getFilesDataPublicMedia,
    resetAll,
    postSignurl,
    isPostSignurlLoading,
    postSignurlError,
    postSignurlData,
    uploadFIle,
    isUploadFIleLoading,
    uploadFIleError,
    uploadFIleData,
    uploadHandler,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFilerStore, import.meta.hot));
}
