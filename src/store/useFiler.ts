/* eslint-disable no-param-reassign */
import { computed, ref } from 'vue';
import { generalErrorHandling } from 'InvestCommon/helpers/generalErrorHandling';
import { fetchGetFiles, fetchGetPublicFiles } from 'InvestCommon/services/api/filer';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { IFilerItem } from 'InvestCommon/types/api/filer';

export const useFilerStore = defineStore('filer', () => {
  const isGetFilesLoading = ref(false);
  const isGetFilesError = ref(false);
  const getFilesData = ref<IFilerItem[]>([]);
  const getFiles = async (object_id: number, object_name: string) => {
    isGetFilesLoading.value = true;
    isGetFilesError.value = false;
    const response = await fetchGetFiles(object_id, object_name).catch((error: Response) => {
      isGetFilesError.value = true;
      void generalErrorHandling(error);
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
  const getFilesPublic = async (object_id: number, object_name: string) => {
    isGetFilesPublicLoading.value = true;
    isGetFilesPublicError.value = false;
    const response = await fetchGetPublicFiles(object_id, object_name).catch((error: Response) => {
      isGetFilesPublicError.value = true;
      void generalErrorHandling(error);
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

  const resetAll = () => {
    getFilesData.value = [];
    getFilesPublicData.value = [];
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
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFilerStore, import.meta.hot));
}
