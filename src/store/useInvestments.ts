import { ref } from 'vue';
import { generalErrorHandling } from 'InvestCommon/helpers/generalErrorHandling';
import {
  fetchGetInvestOne, fetchSetInvest, fetchSetAmount, fetchSetOwnership, fetchSetSignature,
  fetchSetDocument, fetchSetFunding, fetchSetReview, fetchCancelInvest, fetchGetDocument,
  fetchSetAmountOptions,
  fetchSetOwnershipOptions,
  fetchSetFundingOptions,
  fetchSetCancelOptions,
} from 'InvestCommon/services/api/invest';
import { useOfferStore } from 'InvestCommon/store/useOffer';
import {
  IInvest, IInvestConfirm, IInvestDocumentSign, IInvestFunding,
} from 'InvestCommon/types/api/invest';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { INotification } from 'InvestCommon/types/api/notifications';

const isGetInvestOneLoading = ref(false);
const isGetInvestLoading = ref(false);
const isGetAmountLoading = ref(false);
const isSetSignatureLoading = ref(false);
const isSetDocumentLoading = ref(false);
const isGetDocumentLoading = ref(false);
const isSetReviewLoading = ref(false);
const isCancelInvestLoading = ref(false);

const isGetInvestOneError = ref(false);
const isGetInvestError = ref(false);
const isGetAmountError = ref(false);
const isSetSignatureError = ref(false);
const isSetDocumentError = ref(false);
const isGetDocumentError = ref(false);
const isSetReviewError = ref(false);
const isCancelInvestError = ref(false);

const getInvestOneData = ref<IInvest>();
const getInvestData = ref<IInvest>();
const setAmountData = ref<{number_of_shares: number}>();
const setAmountErrorData = ref();
const setAmountOptionsData = ref();
const setSignatureData = ref();
const setDocumentData = ref<IInvestDocumentSign>();
const getDocumentData = ref<string>();
const setReviewData = ref<IInvestConfirm>();
const cancelInvestData = ref();

export const useInvestmentsStore = defineStore('investments', () => {
  const offerStore = useOfferStore();
  const { getOfferOneData } = storeToRefs(offerStore);

  const getInvestOne = async (id: string) => {
    getInvestOneData.value = undefined;
    isGetInvestOneLoading.value = true;
    isGetInvestOneError.value = false;
    const response = await fetchGetInvestOne(id).catch((error: Response) => {
      isGetInvestOneError.value = true;
      generalErrorHandling(error);
    });
    if (response) {
      getInvestOneData.value = response;
    }
    isGetInvestOneLoading.value = false;
  };

  const combinedInvestAndOfferData = ref<IInvest | null>(null);
  const getCombinedInvestAndOfferData = async (id: string) => {
    await getInvestOne(id);
    if (getInvestOneData.value) {
      await offerStore.getOfferOne(getInvestOneData.value.offer.id);
      if (getOfferOneData.value) {
        combinedInvestAndOfferData.value = { ...getInvestOneData.value, offer: getOfferOneData.value };
        return { ...getInvestOneData.value, offer: getOfferOneData.value };
      }
      combinedInvestAndOfferData.value = { ...getInvestOneData.value };
    }
    return null;
  };

  const setInvest = async (slug: string, sharesCount: number) => {
    isGetInvestLoading.value = true;
    isGetInvestError.value = false;
    const response = await fetchSetInvest(slug, sharesCount).catch((error: Response) => {
      isGetInvestError.value = true;
      generalErrorHandling(error);
    });
    if (response) getInvestData.value = response;
    isGetInvestLoading.value = false;
  };

  const setAmount = async (
    slug: string,
    id: string,
    profileId: string,
    shares: number,
  ) => {
    isGetAmountLoading.value = true;
    isGetAmountError.value = false;
    setAmountErrorData.value = undefined;
    const response = await fetchSetAmount(slug, id, profileId, shares).catch(async (error: Response) => {
      isGetAmountError.value = true;
      setAmountErrorData.value = JSON.parse(await error.text());
      generalErrorHandling(error);
    });
    if (response) setAmountData.value = response;
    isGetAmountLoading.value = false;
  };

  const getOptionsSetAmount = async (
    slug: string,
    id: string,
    profileId: string,
  ) => {
    const response = await fetchSetAmountOptions(slug, id, profileId).catch((error: Response) => {
      generalErrorHandling(error);
    });
    if (response) {
      setAmountOptionsData.value = response;
    }
  };

  const isSetOwnershipLoading = ref(false);
  const isSetOwnershipError = ref(false);
  const setOwnershipData = ref<{step: string}>();
  const setOwnershipErrorData = ref();
  const setOwnership = async (
    slug: string,
    id: string,
    profileId: string,
  ) => {
    isSetOwnershipLoading.value = true;
    isSetOwnershipError.value = false;
    setOwnershipErrorData.value = undefined;
    const response = await fetchSetOwnership(slug, id, profileId).catch(async (error: Response) => {
      isSetOwnershipError.value = true;
      setOwnershipErrorData.value = JSON.parse(await error.text());
      generalErrorHandling(error);
    });
    if (response) setOwnershipData.value = response;
    isSetOwnershipLoading.value = false;
  };

  const isSetOwnershipOptionsLoading = ref(false);
  const isSetOwnershipOptionsError = ref(false);
  const setOwnershipOptionsData = ref();
  const setOwnershipOptions = async (
    slug: string,
    id: string,
    profileId: string,
  ) => {
    isSetOwnershipOptionsLoading.value = true;
    isSetOwnershipOptionsError.value = false;
    const response = await fetchSetOwnershipOptions(slug, id, profileId).catch((error: Response) => {
      isSetOwnershipOptionsError.value = true;
      generalErrorHandling(error);
    });
    if (response) setOwnershipOptionsData.value = response;
    isSetOwnershipOptionsLoading.value = false;
  };

  const setSignature = async (
    slug: string,
    id: string,
    profileId: string,
    signatureId: string,
  ) => {
    isSetSignatureLoading.value = true;
    isSetSignatureError.value = false;

    const response = await fetchSetSignature(slug, id, profileId, signatureId)
      .catch((error: Response) => {
        isSetSignatureError.value = true;
        generalErrorHandling(error);
      });

    if (response) setSignatureData.value = response;
    isSetSignatureLoading.value = false;
  };

  const setDocument = async (
    slug: string,
    investId: string,
    profileId: string,
  ) => {
    isSetDocumentLoading.value = true;
    isSetDocumentError.value = false;
    const response = await fetchSetDocument(slug, investId, profileId).catch((error: Response) => {
      isSetDocumentError.value = true;
      generalErrorHandling(error);
    });
    if (response) setDocumentData.value = response;
    isSetDocumentLoading.value = false;
  };

  const getDocument = async (
    investId: string,
  ) => {
    isGetDocumentLoading.value = true;
    isGetDocumentError.value = false;
    const response = await fetchGetDocument(investId).catch((error: Response) => {
      isGetDocumentError.value = true;
      generalErrorHandling(error);
    });
    if (response) getDocumentData.value = URL.createObjectURL(response);
    isGetDocumentLoading.value = false;
  };

  const isSetFundingLoading = ref(false);
  const isSetFundingError = ref(false);
  const setFundingData = ref();
  const setFundingErrorData = ref();
  const setFunding = async (
    slug: string,
    id: string,
    profileId: string,
    fundingData: IInvestFunding,
  ) => {
    isSetFundingLoading.value = true;
    isSetFundingError.value = false;
    setFundingErrorData.value = undefined;

    const response = await fetchSetFunding(slug, id, profileId, fundingData).catch(async (error: Response) => {
      isSetFundingError.value = true;
      setFundingErrorData.value = JSON.parse(await error.text());
      generalErrorHandling(error);
    });

    if (response) setFundingData.value = response;
    isSetFundingLoading.value = false;
  };

  const isSetFundingOptionsLoading = ref(false);
  const isSetFundingOptionsError = ref(false);
  const setFundingOptionsData = ref();
  const setFundingOptions = async (
    slug: string,
    id: string,
    profileId: string,
  ) => {
    isSetFundingOptionsLoading.value = true;
    isSetFundingOptionsError.value = false;

    const response = await fetchSetFundingOptions(slug, id, profileId).catch((error: Response) => {
      isSetFundingOptionsError.value = true;
      generalErrorHandling(error);
    });

    if (response) setFundingOptionsData.value = response;
    isSetFundingOptionsLoading.value = false;
  };

  const isSetCanceOptionsLoading = ref(false);
  const isSetCanceOptionsError = ref(false);
  const setCancelOptionsData = ref({});
  const setCanceOptions = async (id: string) => {
    isSetCanceOptionsLoading.value = true;
    isSetCanceOptionsError.value = false;

    const response = await fetchSetCancelOptions(id).catch((error: Response) => {
      isSetCanceOptionsError.value = true;
      generalErrorHandling(error);
    });

    if (response) setCancelOptionsData.value = response;
    isSetCanceOptionsLoading.value = false;
  };

  const setReview = async (
    slug: string,
    id: string,
    profileId: string,
  ) => {
    isSetReviewLoading.value = true;
    isSetReviewError.value = false;
    const response = await fetchSetReview(slug, id, profileId).catch((error: Response) => {
      isSetReviewError.value = true;
      generalErrorHandling(error);
    });
    if (response) setReviewData.value = response;
    isSetReviewLoading.value = false;
  };

  const setCancelErrorData = ref();
  const cancelInvestment = async (id: string, reason: string) => {
    isCancelInvestLoading.value = true;
    isCancelInvestError.value = false;

    const response = await fetchCancelInvest(id, reason).catch(async (error: Response) => {
      isCancelInvestError.value = true;
      setCancelErrorData.value = JSON.parse(await error.text());
      generalErrorHandling(error);
    });

    if (response) cancelInvestData.value = response;
    isCancelInvestLoading.value = false;
  };

  const updateNotificationData = (notification: INotification) => {
    const objectId = notification.data.fields.object_id;
    const objectStatus = notification.data.fields.status;
    if ((getInvestOneData.value === objectId) && getInvestOneData.value) {
      getInvestOneData.value.status = objectStatus;
    }
  };

  const resetAll = () => {
    getInvestOneData.value = undefined;
    getInvestData.value = undefined;
    setAmountData.value = undefined;
    setOwnershipData.value = undefined;
    setSignatureData.value = undefined;
    setDocumentData.value = undefined;
    getDocumentData.value = undefined;
    setFundingData.value = undefined;
    setReviewData.value = undefined;
    cancelInvestData.value = undefined;
    setAmountErrorData.value = undefined;
    setAmountOptionsData.value = {};
    setOwnershipOptionsData.value = {};
    setFundingOptionsData.value = {};
    setCancelOptionsData.value = {};
    setOwnershipErrorData.value = {};
    setFundingErrorData.value = {};
    setCancelErrorData.value = {};
    combinedInvestAndOfferData.value = null;
  };

  return {
    getInvestOne,
    setInvest,
    setAmount,
    setOwnership,
    setSignature,
    setDocument,
    getDocument,
    setFunding,
    setReview,
    cancelInvestment,
    getCombinedInvestAndOfferData,
    resetAll,
    getOptionsSetAmount,

    isGetInvestOneLoading,
    isGetInvestLoading,
    isGetAmountLoading,
    isSetOwnershipLoading,
    isSetSignatureLoading,
    isSetDocumentLoading,
    isSetFundingLoading,
    isSetReviewLoading,
    isCancelInvestLoading,
    isGetDocumentLoading,

    isGetInvestOneError,
    isGetInvestError,
    isGetAmountError,
    isSetOwnershipError,
    isSetSignatureError,
    isSetDocumentError,
    isSetFundingError,
    isSetReviewError,
    isCancelInvestError,
    isGetDocumentError,

    getInvestOneData,
    getInvestData,
    setAmountData,
    setAmountErrorData,
    setOwnershipData,
    setSignatureData,
    setDocumentData,
    getDocumentData,
    setFundingData,
    setReviewData,
    cancelInvestData,
    setAmountOptionsData,

    setOwnershipErrorData,

    setFundingErrorData,
    setCancelErrorData,

    setOwnershipOptions,
    isSetOwnershipOptionsLoading,
    isSetOwnershipOptionsError,
    setOwnershipOptionsData,
    setFundingOptions,
    isSetFundingOptionsLoading,
    isSetFundingOptionsError,
    setFundingOptionsData,
    setCanceOptions,
    isSetCanceOptionsLoading,
    isSetCanceOptionsError,
    setCancelOptionsData,
    combinedInvestAndOfferData,
    updateNotificationData,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useInvestmentsStore, import.meta.hot));
}
