import { ApiClient } from 'InvestCommon/data/service/apiClient';
import { IInvestDocumentSign } from 'InvestCommon/data/esign/esign.types';
import env from 'InvestCommon/config/env';
import { v4 as uuidv4 } from 'uuid';
import { createRepositoryStates, withActionState } from 'InvestCommon/data/repository/repository';
import { acceptHMRUpdate, defineStore } from 'pinia';

const { ESIGN_URL } = env;

type EsignStates = {
  setDocumentState: IInvestDocumentSign;
  getDocumentState: Blob;
};

export const useRepositoryEsign = defineStore('repository-esign', () => {
  const esignApiClient = new ApiClient(ESIGN_URL);

  const { setDocumentState, getDocumentState, resetAll } = createRepositoryStates<EsignStates>({
    setDocumentState: undefined,
    getDocumentState: undefined,
  });

  const setDocument = async (slug: string, investId: string) =>
    withActionState(setDocumentState, async () => {
      const payload = { investment_id: Number(investId) };
      const response = await esignApiClient.post<IInvestDocumentSign>(`/auth/document`, payload);
      return response.data as IInvestDocumentSign;
    });

  const getDocument = async (investId: string) =>
    withActionState(getDocumentState, async () => {
      const response = await esignApiClient.get<Blob>(`/auth/get_document/${investId}`, {
        headers: {
          'Content-Type': 'application/pdf',
          accept: 'application/pdf',
          'X-Request-ID': uuidv4() as string,
        },
        type: 'blob',
      });
      return response.data as Blob;
    });

  /** Clear setDocument result only (e.g. after signature is done and entity_id is in investment). */
  const clearSetDocumentData = () => {
    setDocumentState.value = { loading: false, error: null, data: undefined };
  };

  return {
    // States
    setDocumentState,
    getDocumentState,

    // Functions
    setDocument,
    getDocument,
    resetAll,
    clearSetDocumentData,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRepositoryEsign, import.meta.hot));
} 