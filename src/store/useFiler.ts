import { ref } from 'vue';
import { generalErrorHandling } from 'InvestCommon/helpers/generalErrorHandling';
import { fetchGetFiles } from 'InvestCommon/services';
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

  const resetAll = () => {
    getFilesData.value = [];
  };


  return {
    getFiles,
    isGetFilesLoading,
    isGetFilesError,
    getFilesData,
    resetAll,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFilerStore, import.meta.hot));
}
