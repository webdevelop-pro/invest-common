import { ref } from 'vue';
import { fetchGetFunding, fetchConnectBankAccount, fetchFundTransfer } from 'InvestCommon/services/api/funding';
import { IFundingData, IBank } from 'InvestCommon/types/api/funding';
import { generalErrorHandling } from 'InvestCommon/helpers/generalErrorHandling';
import { acceptHMRUpdate, defineStore } from 'pinia';

const isGetFundingLoading = ref(false);
const isFundTransferLoading = ref(false);
const isConnectBankLoading = ref(false);

const isGetFundingError = ref(false);
const isFundTransferError = ref(false);
const isConnectBankError = ref(false);

const getFundingData = ref<IFundingData | null>();
const getConnectBankData = ref();
const fundTransferData = ref();

export const useFundingStore = defineStore('funding', () => {
  const getFunding = async () => {
    isGetFundingLoading.value = true;
    isGetFundingError.value = false;
    const response = await fetchGetFunding().catch((error: Response) => {
      isGetFundingError.value = true;
      void generalErrorHandling(error);
    });
    if (response) getFundingData.value = response;
    isGetFundingLoading.value = false;
  };

  const connectBankAccount = async (userId: number, profileId: number, bankData: IBank) => {
    isConnectBankLoading.value = true;
    isConnectBankError.value = false;
    const response = await fetchConnectBankAccount(userId, profileId, bankData).catch((error: Response) => {
      isConnectBankError.value = true;
      void generalErrorHandling(error);
    });
    if (response) getConnectBankData.value = response;
    isConnectBankLoading.value = false;
  };

  const fundTransfer = async (investmentId: number) => {
    isFundTransferLoading.value = true;
    isFundTransferError.value = false;
    const response = await fetchFundTransfer(investmentId).catch((error: Response) => {
      isFundTransferError.value = true;
      void generalErrorHandling(error);
    });
    if (response) fundTransferData.value = response;
    isFundTransferLoading.value = false;
  };

  const resetAll = () => {
    getFundingData.value = undefined;
    getConnectBankData.value = undefined;
    fundTransferData.value = undefined;
  };

  return {
    isGetFundingLoading,
    isConnectBankLoading,
    isFundTransferLoading,

    isGetFundingError,
    isConnectBankError,
    isFundTransferError,

    getFundingData,
    getConnectBankData,
    fundTransferData,

    getFunding,
    connectBankAccount,
    fundTransfer,
    resetAll,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFundingStore, import.meta.hot));
}
