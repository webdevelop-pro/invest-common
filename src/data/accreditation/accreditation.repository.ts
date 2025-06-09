import { ref } from 'vue';
import { ApiClient } from 'UiKit/helpers/api/apiClient';
import { toasterErrorHandling } from 'UiKit/helpers/api/toasterErrorHandling';
import { IAccreditationData } from 'InvestCommon/types/api/invest';
import env from 'InvestCommon/global';
import { v4 as uuidv4 } from 'uuid';

const { ACCREDITATION_URL } = env;

export const useRepositoryAccreditation = () => {
  const apiClient = new ApiClient(ACCREDITATION_URL);
  const accreditation = ref<IAccreditationData[]>([]);
  const isLoadingCreate = ref(false);
  const isLoadingUpdate = ref(false);
  const isLoadingUpload = ref(false);
  const isLoadingCreateEscrow = ref(false);
  const isLoadingGetAll = ref(false);
  const error = ref<Error | null>(null);

  const getAll = async (profileId: number) => {
    isLoadingGetAll.value = true;
    error.value = null;

    try {
      const response = await apiClient.get(`/auth/accreditation/${profileId}`);
      accreditation.value = response.data;
      return response.data;
    } catch (err) {
      error.value = err as Error;
      toasterErrorHandling(err, 'Failed to fetch accreditation data');
      throw err;
    } finally {
      isLoadingGetAll.value = false;
    }
  };

  const create = async (profileId: number, note: string) => {
    isLoadingCreate.value = true;
    error.value = null;

    try {
      const response = await apiClient.post(`/auth/accreditation/create/${profileId}`, {
        ai_method: 'upload',
        notes: note,
      });
      return response.data;
    } catch (err) {
      error.value = err as Error;
      toasterErrorHandling(err, 'Failed to create accreditation');
      throw err;
    } finally {
      isLoadingCreate.value = false;
    }
  };

  const update = async (profileId: number, note: string) => {
    isLoadingUpdate.value = true;
    error.value = null;

    try {
      const response = await apiClient.post(`/auth/accreditation/update/${profileId}`, {
        ai_method: 'upload',
        notes: note,
        status: 'New Info Added',
      });
      return response.data;
    } catch (err) {
      error.value = err as Error;
      toasterErrorHandling(err, 'Failed to update accreditation');
      throw err;
    } finally {
      isLoadingUpdate.value = false;
    }
  };

  const uploadDocument = async (userId: number, profileId: number, formData: FormData) => {
    isLoadingUpload.value = true;
    error.value = null;

    try {
      const response = await apiClient.post(`/auth/accreditation/upload_document/${userId}/${profileId}`, formData, {
        headers: {
          'X-Request-ID': uuidv4() as string,
        },
        baseURL: ACCREDITATION_URL,
      });
      return response.data;
    } catch (err) {
      error.value = err as Error;
      toasterErrorHandling(err, 'Failed to upload accreditation document');
      throw err;
    } finally {
      isLoadingUpload.value = false;
    }
  };

  const createEscrow = async (userId: number, profileId: number) => {
    isLoadingCreateEscrow.value = true;
    error.value = null;

    try {
      const response = await apiClient.post(`/auth/escrow/${userId}/${profileId}`, null, {
        headers: {
          'X-Request-ID': uuidv4(),
        },
      });
      return response.data;
    } catch (err) {
      error.value = err as Error;
      toasterErrorHandling(err, 'Failed to create escrow');
      throw err;
    } finally {
      isLoadingCreateEscrow.value = false;
    }
  };

  const reset = () => {
    accreditation.value = [];
    isLoadingCreate.value = false;
    isLoadingUpdate.value = false;
    isLoadingUpload.value = false;
    isLoadingCreateEscrow.value = false;
    isLoadingGetAll.value = false;
    error.value = null;
  };

  return {
    accreditation,
    isLoadingCreate,
    isLoadingUpdate,
    isLoadingUpload,
    isLoadingCreateEscrow,
    isLoadingGetAll,
    error,
    getAll,
    create,
    update,
    uploadDocument,
    createEscrow,
    reset,
  };
};
