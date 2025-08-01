import { ref } from 'vue';
import { generalErrorHandling } from 'UiKit/helpers/generalErrorHandling';
import { IInvest, IInvestData } from 'InvestCommon/types/api/invest';
import {
  IOffer, IOfferData, IOfferComment, IOfferCommentPayload,
} from 'InvestCommon/types/api/offers';
import {
  fetchGetOfferOne, fetchGetOffers, fetchGetOfferComments,
  fetchSetOfferComment, fetchSetOfferCommentOptions,
} from 'InvestCommon/services/api/offers';
import { fetchGetInvestUnconfirmed, fetchGetInvestments } from 'InvestCommon/services/api/invest';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { INotification } from 'InvestCommon/data/notifications/notifications.types';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { OfferFormatter } from 'InvestCommon/data/offer/offer.formatter';
import { IOfferFormatted } from 'InvestCommon/data/offer/offer.types';

const unconfirmedOffersFilter = (unInv: IInvest[], slug: string, profileId: number | string) => (
  unInv.find((item) => item?.offer?.slug === slug && item?.profile_id === profileId));

export const useOfferStore = defineStore('offers', () => {
  const profilesStore = useProfilesStore();
  const { selectedUserProfileId } = storeToRefs(profilesStore);

  const isGetOffersLoading = ref(false);
  const isGetOffersError = ref(false);
  const getOffersData = ref<IOfferData>();
  const getOffers = async () => {
    isGetOffersLoading.value = true;
    isGetOffersError.value = false;
    const response = await fetchGetOffers().catch((error: Response) => {
      isGetOffersError.value = true;
      generalErrorHandling(error);
    });
    if (response) getOffersData.value = response;
    isGetOffersLoading.value = false;
  };

  const isGetOfferOneLoading = ref(false);
  const isGetOfferOneError = ref(false);
  const getOfferOneData = ref<IOfferFormatted>();
  const getOfferOne = async (slug: string | number) => {
    isGetOfferOneLoading.value = true;
    isGetOfferOneError.value = false;
    const response = await fetchGetOfferOne(slug).catch((error: Response) => {
      isGetOfferOneError.value = true;
      generalErrorHandling(error);
    });
    if (response) {
      const formatter = new OfferFormatter(response);
      getOfferOneData.value = formatter.format();
    }
    isGetOfferOneLoading.value = false;
  };

  const isGetUnconfirmedOffersError = ref(false);
  const isGetUnconfirmedOffersLoading = ref(false);
  const getUnconfirmedOffersData = ref<IInvest[]>();
  const getUnconfirmedOffers = async () => {
    isGetUnconfirmedOffersLoading.value = true;
    isGetUnconfirmedOffersError.value = false;
    const response = await fetchGetInvestUnconfirmed().catch((error: Response) => {
      isGetUnconfirmedOffersError.value = true;
      generalErrorHandling(error);
    });
    if (response) {
      getUnconfirmedOffersData.value = response?.data;
    }
    isGetUnconfirmedOffersLoading.value = false;
  };

  const isGetUnconfirmedOfferOneError = ref(false);
  const isGetUnconfirmedOfferOneLoading = ref(false);
  const getUnconfirmedOfferData = ref<IInvest | null>();
  const getUnconfirmedOfferOne = async (slug: string) => {
    isGetUnconfirmedOfferOneLoading.value = true;
    isGetUnconfirmedOfferOneError.value = false;
    getUnconfirmedOfferData.value = null;
    const response = await fetchGetInvestUnconfirmed().catch((error: Response) => {
      isGetUnconfirmedOfferOneError.value = true;
      generalErrorHandling(error);
    });
    if (response) {
      if (response.data.length) {
        getUnconfirmedOfferData.value = unconfirmedOffersFilter(response.data, slug, selectedUserProfileId.value);
      } else {
        getUnconfirmedOfferData.value = null;
      }
    }
    isGetUnconfirmedOfferOneLoading.value = false;
  };

  const isGetInvestmentsLoading = ref(false);
  const isGetInvestmentsError = ref(false);
  const getInvestmentsData = ref<IInvestData>();
  const getConfirmedOffers = async (profile_id: number) => {
    isGetInvestmentsLoading.value = true;
    isGetInvestmentsError.value = false;
    const response = await fetchGetInvestments(profile_id).catch((error: Response) => {
      isGetInvestmentsError.value = true;
      generalErrorHandling(error);
    });
    if (response) {
      getInvestmentsData.value = response;
    }
    isGetInvestmentsLoading.value = false;
  };

  const isGetOfferCommentsLoading = ref(false);
  const isGetOfferCommentsError = ref(false);
  const getOfferCommentsData = ref<IOfferComment[]>();
  const getOfferComments = async (id: number) => {
    isGetOfferCommentsLoading.value = true;
    isGetOfferCommentsError.value = false;
    const response = await fetchGetOfferComments(id).catch((error: Response) => {
      isGetOfferCommentsError.value = true;
      generalErrorHandling(error);
    });
    if (response) {
      getOfferCommentsData.value = response.data;
    }
    isGetOfferCommentsLoading.value = false;
  };

  const isSetOfferCommentLoading = ref(false);
  const isSetOfferCommentError = ref(false);
  const setOfferCommentsData = ref<{id: number}>();
  const setOfferCommentsErrorData = ref();
  const setOfferComment = async (payload: IOfferCommentPayload) => {
    isSetOfferCommentLoading.value = true;
    isSetOfferCommentError.value = false;
    setOfferCommentsErrorData.value = undefined;
    const response = await fetchSetOfferComment(payload).catch(async (error: Response) => {
      isSetOfferCommentError.value = true;
      setOfferCommentsErrorData.value = JSON.parse(await error.text());
      generalErrorHandling(error);
    });
    if (response) setOfferCommentsData.value = response;
    isSetOfferCommentLoading.value = false;
  };

  const isSetOfferCommentOptionsLoading = ref(false);
  const isSetOfferCommentOptionsError = ref(false);
  const setOfferCommentsOptionsData = ref();
  const setOfferCommentOptions = async () => {
    isSetOfferCommentOptionsLoading.value = true;
    isSetOfferCommentOptionsError.value = false;
    const response = await fetchSetOfferCommentOptions().catch((error: Response) => {
      isSetOfferCommentOptionsError.value = true;
      generalErrorHandling(error);
    });
    if (response) setOfferCommentsOptionsData.value = response;
    isSetOfferCommentOptionsLoading.value = false;
  };

  const updateNotificationData = (notification: INotification) => {
    const objectId = notification.data.fields.object_id;
    const objectStatus = notification.data.fields.status;
    const confirmedShares = notification.data.fields.confirmed_shares;
    const SubscribedShares = notification.data.fields.subscribed_shares;
    if (objectStatus) {
      if (!getInvestmentsData.value) return;
      const investObject = getInvestmentsData.value?.data.find((item: IInvest) => item.id === objectId);
      if (investObject?.status) investObject.status = objectStatus;
    }
    if (confirmedShares || SubscribedShares) {
      const offerLocal = getOffersData.value?.data.find((offer: IOffer) => offer.id === objectId);
      if (offerLocal && confirmedShares) offerLocal.confirmed_shares = confirmedShares;
      if (offerLocal && SubscribedShares) offerLocal.subscribed_shares = SubscribedShares;
      if (confirmedShares && getOfferOneData.value && (getOfferOneData.value?.id === objectId)) {
        getOfferOneData.value.confirmed_shares = confirmedShares;
      }
      if (SubscribedShares && getOfferOneData.value && (getOfferOneData.value?.id === objectId)) {
        getOfferOneData.value.subscribed_shares = SubscribedShares;
      }
    }
    getConfirmedOffers(selectedUserProfileId.value);
  };

  const getOfferFundedPercent = (offer: IOffer) => {
    if (!offer) return;
    const percent = (offer.subscribed_shares / offer.total_shares) * 100;
    if (percent > 85) return Math.floor(percent);
    return Math.ceil(percent);
  };

  return {
    getOfferOne,
    getUnconfirmedOfferOne,
    getUnconfirmedOffers,
    getConfirmedOffers,
    getOffers,
    getOfferComments,

    isGetOfferOneLoading,
    isGetUnconfirmedOfferOneLoading,
    isGetInvestmentsLoading,
    isGetOffersLoading,
    isGetUnconfirmedOffersLoading,
    isGetOfferCommentsLoading,

    isGetOffersError,
    isGetOfferOneError,
    isGetInvestmentsError,
    isGetUnconfirmedOfferOneError,
    isGetUnconfirmedOffersError,
    isGetOfferCommentsError,

    getOffersData,
    getOfferOneData,
    getInvestmentsData,
    getOfferCommentsData,
    getUnconfirmedOffersData,
    getUnconfirmedOfferData,

    setOfferComment,
    isSetOfferCommentLoading,
    isSetOfferCommentError,
    setOfferCommentsData,
    setOfferCommentsErrorData,
    setOfferCommentOptions,
    isSetOfferCommentOptionsLoading,
    isSetOfferCommentOptionsError,
    setOfferCommentsOptionsData,
    updateNotificationData,
    getOfferFundedPercent,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useOfferStore, import.meta.hot));
}
