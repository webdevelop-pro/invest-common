import { ref } from 'vue';
import {
  fetchCreateAccreditation, fetchUploadAccreditationDocument, fetchCreateEscrow, fetchUpdateAccreditation,
} from 'InvestCommon/services/api/accreditation';
import { generalErrorHandling } from 'InvestCommon/helpers/generalErrorHandling';
import { acceptHMRUpdate, defineStore } from 'pinia';

const isCreateAccreditationLoading = ref(false);
const isUploadAccreditationDocumentLoading = ref(false);
const isCreateEscrowLoading = ref(false);

const isCreateAccreditationError = ref(false);
const isUploadAccreditationDocumentError = ref(false);
const isCreateEscrowError = ref(false);

const createAccreditationData = ref();
const uploadAccreditationDocumentData = ref();
const createEscrowData = ref();

export const useAccreditationStore = defineStore('accreditation', () => {
  const createAccreditation = async (profileId: number, note: string) => {
    isCreateAccreditationLoading.value = true;
    isCreateAccreditationError.value = false;
    const response = await fetchCreateAccreditation(profileId, note).catch((error: Response) => {
      isCreateAccreditationError.value = true;
      generalErrorHandling(error);
    });
    if (response) createAccreditationData.value = response;
    isCreateAccreditationLoading.value = false;
  };

  const isUpdateAccreditationLoading = ref(false);
  const isUpdateAccreditationError = ref(false);
  const updateAccreditationData = ref();
  const updateAccreditation = async (profileId: number, note: string) => {
    isUpdateAccreditationLoading.value = true;
    isUpdateAccreditationError.value = false;
    const response = await fetchUpdateAccreditation(profileId, note).catch((error: Response) => {
      isUpdateAccreditationError.value = true;
      generalErrorHandling(error);
    });
    if (response) updateAccreditationData.value = response;
    isUpdateAccreditationLoading.value = false;
  };

  const uploadAccreditationDocumentErrorData = ref();
  const uploadAccreditationDocument = async (userId: number, profileId: number, file: FormData) => {
    isUploadAccreditationDocumentLoading.value = true;
    isUploadAccreditationDocumentError.value = false;
    const response = await fetchUploadAccreditationDocument(userId, profileId, file)
      .catch(async (error: Response) => {
        isUploadAccreditationDocumentError.value = true;
        uploadAccreditationDocumentErrorData.value = JSON.parse(await error.text());
        generalErrorHandling(error);
      });
    if (response) uploadAccreditationDocumentData.value = response;
    isUploadAccreditationDocumentLoading.value = false;
  };

  const createEscrow = async (userId: number, profileId: number) => {
    isCreateEscrowLoading.value = true;
    isCreateEscrowError.value = false;
    const response = await fetchCreateEscrow(userId, profileId)
      .catch((error: Response) => {
        isCreateEscrowError.value = true;
        generalErrorHandling(error);
      });
    if (response) createEscrowData.value = response;
    isCreateEscrowLoading.value = false;
  };

  const resetAll = () => {
    createAccreditationData.value = undefined;
    uploadAccreditationDocumentData.value = undefined;
    createEscrowData.value = undefined;
    uploadAccreditationDocumentErrorData.value = undefined;
    updateAccreditationData.value = undefined;
  };

  return {
    isCreateAccreditationLoading,
    isUploadAccreditationDocumentLoading,
    isCreateEscrowLoading,

    isCreateAccreditationError,
    isUploadAccreditationDocumentError,
    isCreateEscrowError,

    createAccreditationData,
    uploadAccreditationDocumentData,
    createEscrowData,
    uploadAccreditationDocumentErrorData,

    createAccreditation,
    uploadAccreditationDocument,
    createEscrow,
    resetAll,
    updateAccreditation,
    isUpdateAccreditationLoading,
    isUpdateAccreditationError,
    updateAccreditationData,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAccreditationStore, import.meta.hot));
}
