import { ApiClient } from 'InvestCommon/data/service/apiClient';
import { toasterErrorHandling } from 'InvestCommon/data/repository/error/toasterErrorHandling';
import { IInvestDocumentSign } from 'InvestCommon/types/api/invest';
import env from 'InvestCommon/domain/config/env';
import { v4 as uuidv4 } from 'uuid';
import { createActionState } from 'InvestCommon/data/repository/repository';
import { acceptHMRUpdate, defineStore } from 'pinia';

const { ESIGN_URL } = env;

export const useRepositoryEsign = defineStore('repositoryEsign', () => {
  const esignApiClient = new ApiClient(ESIGN_URL);

  // Create action states for each function
  const setDocumentState = createActionState<IInvestDocumentSign>();
  const getDocumentState = createActionState<Blob>();

  const setDocument = async (slug: string, investId: string, profileId: string) => {
    try {
      setDocumentState.value.loading = true;
      setDocumentState.value.error = null;
      const response = await esignApiClient.post(`/auth/create_document/${slug}/esign/${investId}/${profileId}`);
      setDocumentState.value.data = response.data as IInvestDocumentSign;
      return response.data as IInvestDocumentSign;
    } catch (err) {
      setDocumentState.value.error = err as Error;
      setDocumentState.value.data = undefined;
      toasterErrorHandling(err, 'Failed to set document');
      throw err;
    } finally {
      setDocumentState.value.loading = false;
    }
  };

  const getDocument = async (investId: string) => {
    try {
      getDocumentState.value.loading = true;
      getDocumentState.value.error = null;
      const response = await esignApiClient.get(`/auth/get_document/${investId}`, {
        headers: {
          'Content-Type': 'application/pdf',
          accept: 'application/pdf',
          'X-Request-ID': uuidv4() as string,
        },
        type: 'blob',
      });
      getDocumentState.value.data = response.data as Blob;
      return response.data as Blob;
    } catch (err) {
      getDocumentState.value.error = err as Error;
      getDocumentState.value.data = undefined;
      toasterErrorHandling(err, 'Failed to get document');
      throw err;
    } finally {
      getDocumentState.value.loading = false;
    }
  };

  const resetAll = () => {
    setDocumentState.value = { loading: false, error: null, data: undefined };
    getDocumentState.value = { loading: false, error: null, data: undefined };
  };

  return {
    // States
    setDocumentState,
    getDocumentState,

    // Functions
    setDocument,
    getDocument,
    resetAll,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRepositoryEsign, import.meta.hot));
} 