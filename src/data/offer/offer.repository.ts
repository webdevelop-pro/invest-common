import { ApiClient } from 'InvestCommon/data/service/apiClient';
import { toasterErrorHandling } from 'InvestCommon/data/repository/error/toasterErrorHandling';
import {
  IOffer, IOfferData, IOfferCommentsResponse, IOfferCommentPayload,
} from 'InvestCommon/types/api/offers';
import env from 'InvestCommon/domain/config/env';
import { createActionState } from 'InvestCommon/data/repository/repository';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { OfferFormatter } from 'InvestCommon/data/offer/offer.formatter';
import { IOfferFormatted } from 'InvestCommon/data/offer/offer.types';
import { INotification } from 'InvestCommon/data/notifications/notifications.types';

const { OFFER_URL } = env;

export const useRepositoryOffer = defineStore('repository-offer', () => {
  const apiClient = new ApiClient(OFFER_URL);

  // Create action states for each function
  const getOffersState = createActionState<IOfferData>();
  const getOfferOneState = createActionState<IOfferFormatted>(new OfferFormatter().format());
  const getOfferCommentsState = createActionState<IOfferCommentsResponse>();
  const setOfferCommentState = createActionState<{id: number}>();
  const setOfferCommentOptionsState = createActionState<any>();

  const getOffers = async () => {
    try {
      getOffersState.value.loading = true;
      getOffersState.value.error = null;
      const response = await apiClient.get('/public/offer');
      const rawData = response.data as IOfferData;

      // Format offers if data array exists
      const formattedData = rawData.data && Array.isArray(rawData.data)
        ? {
          ...rawData,
          data: rawData.data
            .map((offer: any) => new OfferFormatter(offer as IOffer).format())
            .sort((a: IOfferFormatted, b: IOfferFormatted) => {
              // Put offers with isClosingSoon: true at the end
              if (a.isClosingSoon && !b.isClosingSoon) return 1;
              if (!a.isClosingSoon && b.isClosingSoon) return -1;
              return 0;
            }),
        }
        : rawData;

      getOffersState.value.data = formattedData;
      return formattedData;
    } catch (err) {
      getOffersState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to fetch offers');
      throw err;
    } finally {
      getOffersState.value.loading = false;
    }
  };

  const getOfferOne = async (slug: string | number) => {
    try {
      getOfferOneState.value.loading = true;
      getOfferOneState.value.error = null;
      const response = await apiClient.get(`/public/offer/${slug}`);
      const offerData = response.data as IOffer;
      const formatter = new OfferFormatter(offerData);
      const formattedData = formatter.format();
      getOfferOneState.value.data = formattedData;
      return formattedData;
    } catch (err) {
      getOfferOneState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to fetch offer');
      throw err;
    } finally {
      getOfferOneState.value.loading = false;
    }
  };

  const getOfferComments = async (id: number) => {
    try {
      getOfferCommentsState.value.loading = true;
      getOfferCommentsState.value.error = null;
      const response = await apiClient.get(`/public/comment/${id}`);
      const commentsData = response.data as IOfferCommentsResponse;
      getOfferCommentsState.value.data = commentsData;
      return commentsData;
    } catch (err) {
      getOfferCommentsState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to fetch offer comments');
      throw err;
    } finally {
      getOfferCommentsState.value.loading = false;
    }
  };

  const setOfferComment = async (payload: IOfferCommentPayload) => {
    try {
      setOfferCommentState.value.loading = true;
      setOfferCommentState.value.error = null;
      const response = await apiClient.post('/auth/comment', payload);
      const commentData = response.data as {id: number};
      setOfferCommentState.value.data = commentData;
      return commentData;
    } catch (err) {
      setOfferCommentState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to set offer comment');
      throw err;
    } finally {
      setOfferCommentState.value.loading = false;
    }
  };

  const setOfferCommentOptions = async () => {
    try {
      setOfferCommentOptionsState.value.loading = true;
      setOfferCommentOptionsState.value.error = null;
      const response = await apiClient.options('/auth/comment');
      setOfferCommentOptionsState.value.data = response.data;
      return response.data;
    } catch (err) {
      setOfferCommentOptionsState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to fetch offer comment options');
      throw err;
    } finally {
      setOfferCommentOptionsState.value.loading = false;
    }
  };

  // Helper function to get offer funded percentage
  const getOfferFundedPercent = (offer: IOffer) => {
    if (!offer) return 0;
    const percent = (offer.subscribed_shares / offer.total_shares) * 100;
    if (percent > 85) return Math.floor(percent);
    return Math.ceil(percent);
  };

  const updateNotificationData = (notification: INotification) => {
    const { fields } = notification.data;
    const objectId = fields?.object_id;
    Object.assign(getOfferOneState.value.data, fields);  
    getOfferOneState.value.data = new OfferFormatter(getOfferOneState.value.data).format();

    if (!getOffersState.value.data) {
      getOffersState.value.data = [];
    }
    const index = getOffersState.value.data?.findIndex((t) => t.id === objectId);
    Object.assign(getOffersState.value.data[index], fields);
    Object.assign(
      getOffersState.value.data[index], 
      new OfferFormatter(getOffersState.value.data[index]).format()
    );
  };

  // Returns the not-closed offer with the highest funded percent
  const getTopOpenOffer = (): IOfferFormatted | undefined => {
    const items = (getOffersState.value.data as unknown as { data?: IOfferFormatted[] })?.data;
    if (!items || items.length === 0) return undefined;
    const openOffers = items.filter((offer) => !offer.isFundingCompleted && offer.offerFundedPercent < 100);
    if (openOffers.length === 0) return undefined;
    const result = openOffers.reduce<IOfferFormatted>((best, current) => (
      current.offerFundedPercent > best.offerFundedPercent ? current : best
    ));
    result.tagText = '🔥 Hot';
    result.showTag = true;
    result.tagBackground = 'is--background-yellow-light';
    return result;
  };

  const resetAll = () => {
    getOffersState.value = { loading: false, error: null, data: undefined };
    getOfferOneState.value = { loading: false, error: null, data: undefined };
    getOfferCommentsState.value = { loading: false, error: null, data: undefined };
    setOfferCommentState.value = { loading: false, error: null, data: undefined };
    setOfferCommentOptionsState.value = { loading: false, error: null, data: undefined };
  };

  return {
    // Actions
    getOffers,
    getOfferOne,
    getOfferComments,
    setOfferComment,
    setOfferCommentOptions,
    getOfferFundedPercent,
    updateNotificationData,
    getTopOpenOffer,
    resetAll,

    // States
    getOffersState,
    getOfferOneState,
    getOfferCommentsState,
    setOfferCommentState,
    setOfferCommentOptionsState,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRepositoryOffer, import.meta.hot));
}
