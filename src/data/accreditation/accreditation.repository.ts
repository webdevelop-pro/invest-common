import { ApiClient } from 'InvestCommon/data/service/apiClient';
import { toasterErrorHandling } from 'InvestCommon/data/repository/error/toasterErrorHandling';
import { IAccreditationData } from 'InvestCommon/types/api/invest';
import env from 'InvestCommon/domain/config/env';
import { v4 as uuidv4 } from 'uuid';
import { createActionState } from 'InvestCommon/data/repository/repository';

const { ACCREDITATION_URL } = env;

export const useRepositoryAccreditation = () => {
  const apiClient = new ApiClient(ACCREDITATION_URL);

  // Create action states for each function
  const getAllState = createActionState<IAccreditationData[]>();
  const createState = createActionState<any>();
  const updateState = createActionState<any>();
  const uploadDocumentState = createActionState<any>();
  const createEscrowState = createActionState<any>();

  const getAll = async (profileId: number) => {
    try {
      getAllState.value.loading = true;
      getAllState.value.error = null;
      const response = await apiClient.get(`/auth/accreditation/${profileId}`);
      getAllState.value.data = response.data;
      return response.data;
    } catch (err) {
      getAllState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to fetch accreditation data');
      throw err;
    } finally {
      getAllState.value.loading = false;
    }
  };

  const create = async (profileId: number, note: string) => {
    try {
      createState.value.loading = true;
      createState.value.error = null;
      const response = await apiClient.post(`/auth/accreditation/create/${profileId}`, {
        ai_method: 'upload',
        notes: note,
      });
      createState.value.data = response.data;
      return response.data;
    } catch (err) {
      createState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to create accreditation');
      throw err;
    } finally {
      createState.value.loading = false;
    }
  };

  const update = async (profileId: number, note: string) => {
    try {
      updateState.value.loading = true;
      updateState.value.error = null;
      const response = await apiClient.post(`/auth/accreditation/update/${profileId}`, {
        ai_method: 'upload',
        notes: note,
        status: 'New Info Added',
      });
      updateState.value.data = response.data;
      return response.data;
    } catch (err) {
      updateState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to update accreditation');
      throw err;
    } finally {
      updateState.value.loading = false;
    }
  };

  const uploadDocument = async (userId: number, profileId: number, formData: FormData) => {
    try {
      uploadDocumentState.value.loading = true;
      uploadDocumentState.value.error = null;
      const response = await apiClient.post(`/auth/accreditation/upload_document/${userId}/${profileId}`, formData, {
        headers: {
          'X-Request-ID': uuidv4() as string,
        },
        baseURL: ACCREDITATION_URL,
      });
      uploadDocumentState.value.data = response.data;
      return response.data;
    } catch (err) {
      uploadDocumentState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to upload accreditation document');
      throw err;
    } finally {
      uploadDocumentState.value.loading = false;
    }
  };

  const createEscrow = async (userId: number, profileId: number) => {
    try {
      createEscrowState.value.loading = true;
      createEscrowState.value.error = null;
      const response = await apiClient.post(`/auth/escrow/${userId}/${profileId}`, null, {
        headers: {
          'X-Request-ID': uuidv4(),
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
      });
      createEscrowState.value.data = response.data;
      return response.data;
    } catch (err) {
      createEscrowState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to create escrow');
      throw err;
    } finally {
      createEscrowState.value.loading = false;
    }
  };

  const resetAll = () => {
    getAllState.value = { loading: false, error: null, data: undefined };
    createState.value = { loading: false, error: null, data: undefined };
    updateState.value = { loading: false, error: null, data: undefined };
    uploadDocumentState.value = { loading: false, error: null, data: undefined };
    createEscrowState.value = { loading: false, error: null, data: undefined };
  };

  return {
    // States
    getAllState,
    createState,
    updateState,
    uploadDocumentState,
    createEscrowState,

    // Functions
    getAll,
    create,
    update,
    uploadDocument,
    createEscrow,
    resetAll,
  };
};
