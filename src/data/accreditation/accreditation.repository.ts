import { ApiClient } from 'InvestCommon/data/service/apiClient';
import { IAccreditationData } from 'InvestCommon/types/api/invest';
import env from 'InvestCommon/config/env';
import { v4 as uuidv4 } from 'uuid';
import { createRepositoryStates, withActionState, type OptionsStateData } from 'InvestCommon/data/repository/repository';
import { acceptHMRUpdate, defineStore } from 'pinia';

const { ACCREDITATION_URL } = env;

type AccreditationStates = {
  getAllState: IAccreditationData[];
  createState: OptionsStateData;
  updateState: OptionsStateData;
  uploadDocumentState: OptionsStateData;
  createEscrowState: OptionsStateData;
};

export const useRepositoryAccreditation = defineStore('repository-accreditation', () => {
  const apiClient = new ApiClient(ACCREDITATION_URL);

  const {
    getAllState,
    createState,
    updateState,
    uploadDocumentState,
    createEscrowState,
    resetAll,
  } = createRepositoryStates<AccreditationStates>({
    getAllState: undefined,
    createState: undefined,
    updateState: undefined,
    uploadDocumentState: undefined,
    createEscrowState: undefined,
  });

  const getAll = async (profileId: number) =>
    withActionState(getAllState, async () => {
      const response = await apiClient.get(`/auth/accreditation/${profileId}`);
      return response.data;
    });

  const create = async (profileId: number, note: string) =>
    withActionState(createState, async () => {
      const response = await apiClient.post(`/auth/accreditation/create/${profileId}`, {
        ai_method: 'upload',
        notes: note,
      });
      return response.data;
    });

  const update = async (profileId: number, note: string) =>
    withActionState(updateState, async () => {
      const response = await apiClient.post(`/auth/accreditation/update/${profileId}`, {
        ai_method: 'upload',
        notes: note,
        status: 'New Info Added',
      });
      return response.data;
    });

  const uploadDocument = async (userId: number, profileId: number, formData: FormData) =>
    withActionState(uploadDocumentState, async () => {
      const response = await apiClient.post(`/auth/accreditation/upload_document/${userId}/${profileId}`, formData, {
        headers: {
          'X-Request-ID': uuidv4() as string,
        },
        baseURL: ACCREDITATION_URL,
      });
      return response.data;
    });

  const createEscrow = async (userId: number, profileId: number) =>
    withActionState(createEscrowState, async () => {
      const response = await apiClient.post(`/auth/escrow/${userId}/${profileId}`, null, {
        headers: {
          'X-Request-ID': uuidv4(),
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
      });
      return response.data;
    });

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
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRepositoryAccreditation, import.meta.hot));
}
