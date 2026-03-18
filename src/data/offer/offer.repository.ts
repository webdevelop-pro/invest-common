import { ApiClient } from 'InvestCommon/data/service/apiClient';
import {
  IOffer,
  IOfferData,
  IOfferCommentsResponse,
  IOfferCommentPayload,
} from 'InvestCommon/data/offer/offer.types';
import env from 'InvestCommon/config/env';
import {
  applyOfflineHydrationMeta,
  createRepositoryStates,
  withActionState,
  type OptionsStateData,
} from 'InvestCommon/data/repository/repository';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { OfferFormatter } from 'InvestCommon/data/offer/offer.formatter';
import { IOfferFormatted, IOffer as IOfferApp } from 'InvestCommon/data/offer/offer.types';
import { INotification } from 'InvestCommon/data/notifications/notifications.types';
import { createFormatterCache } from 'InvestCommon/data/repository/formatterCache';

const { OFFER_URL } = env;

type OfferStates = {
  getOffersState: IOfferData;
  getOfferOneState: IOfferFormatted;
  getOfferCommentsState: IOfferCommentsResponse;
  setOfferCommentState: { id: number };
  setOfferCommentOptionsState: OptionsStateData;
};

export const useRepositoryOffer = defineStore('repository-offer', () => {
  const apiClient = new ApiClient(OFFER_URL);
  const getOfferSignature = (offer: IOfferApp) => {
    const securityInfo = offer.security_info ?? {};
    const offerData = offer.data ?? {};

    return JSON.stringify({
      id: offer.id ?? 0,
      name: offer.name ?? '',
      legal_name: offer.legal_name ?? '',
      slug: offer.slug ?? '',
      title: offer.title ?? '',
      security_type: offer.security_type ?? '',
      price_per_share: offer.price_per_share ?? 0,
      min_investment: offer.min_investment ?? 0,
      image_link_id: offer.image_link_id ?? 0,
      total_shares: offer.total_shares ?? 0,
      valuation: offer.valuation ?? 0,
      subscribed_shares: offer.subscribed_shares ?? 0,
      confirmed_shares: offer.confirmed_shares ?? 0,
      status: offer.status ?? '',
      approved_at: offer.approved_at ?? '',
      close_at: offer.close_at ?? '',
      seo_title: offer.seo_title ?? '',
      seo_description: offer.seo_description ?? '',
      description: offer.description ?? '',
      highlights: offer.highlights ?? '',
      risk_disclosures: offer.risk_disclosures ?? '',
      additional_details: offer.additional_details ?? '',
      website: offer.website ?? '',
      state: offer.state ?? '',
      city: offer.city ?? '',
      amount_raised: offer.amount_raised ?? 0,
      target_raise: offer.target_raise ?? 0,
      reg_type: offer.reg_type ?? '',
      linkedin: offer.linkedin ?? '',
      facebook: offer.facebook ?? '',
      twitter: offer.twitter ?? '',
      github: offer.github ?? '',
      instagram: offer.instagram ?? '',
      telegram: offer.telegram ?? '',
      mastodon: offer.mastodon ?? '',
      data: {
        wire_to: offerData.wire_to ?? '',
        swift_id: offerData.swift_id ?? '',
        custodian: offerData.custodian ?? '',
        account_number: offerData.account_number ?? '',
        routing_number: offerData.routing_number ?? '',
        apy: offerData.apy ?? '',
        distribution_frequency: offerData.distribution_frequency ?? '',
        investment_strategy: offerData.investment_strategy ?? '',
        estimated_hold_period: offerData.estimated_hold_period ?? '',
        video: offerData.video ?? '',
      },
      security_info: {
        voting_rights: securityInfo.voting_rights ?? '',
        liquidation_preference: securityInfo.liquidation_preference ?? '',
        dividend_type: securityInfo.dividend_type ?? '',
        dividend_rate: securityInfo.dividend_rate ?? '',
        dividend_payment_frequency: securityInfo.dividend_payment_frequency ?? '',
        cn_valuation_cap: securityInfo.cn_valuation_cap ?? '',
        cn_discount_rate: securityInfo.cn_discount_rate ?? '',
        cn_interest_rate: securityInfo.cn_interest_rate ?? '',
        cn_maturity_date: securityInfo.cn_maturity_date ?? '',
        interest_rate_apy: securityInfo.interest_rate_apy ?? '',
        debt_payment_schedule: securityInfo.debt_payment_schedule ?? '',
        debt_maturity_date: securityInfo.debt_maturity_date ?? '',
        debt_interest_rate: securityInfo.debt_interest_rate ?? '',
        debt_term_length: securityInfo.debt_term_length ?? '',
        debt_term_unit: securityInfo.debt_term_unit ?? '',
        pre_money_valuation: securityInfo.pre_money_valuation ?? 0,
      },
    });
  };
  const offerCache = createFormatterCache<IOfferApp, IOfferFormatted>({
    getKey: (offer) => Number(offer.id) || 0,
    getSignature: getOfferSignature,
    format: (offer) => new OfferFormatter(offer).format(),
  });

  const {
    getOffersState,
    getOfferOneState,
    getOfferCommentsState,
    setOfferCommentState,
    setOfferCommentOptionsState,
    resetAll: resetActionStates,
  } = createRepositoryStates<OfferStates>({
    getOffersState: undefined,
    getOfferOneState: offerCache.format({} as IOfferApp),
    getOfferCommentsState: undefined,
    setOfferCommentState: undefined,
    setOfferCommentOptionsState: undefined,
  });

  const getOffers = async () =>
    withActionState(getOffersState, async () => {
      const response = await apiClient.get('/public/offer');
      applyOfflineHydrationMeta(getOffersState, response.headers);
      const rawData = response.data as IOfferData;
      if (rawData.data && Array.isArray(rawData.data)) {
        offerCache.prune(rawData.data as unknown as IOfferApp[]);
      }
      const formattedData = rawData.data && Array.isArray(rawData.data)
        ? {
            ...rawData,
            data: offerCache
              .formatMany(rawData.data as unknown as IOfferApp[])
              .sort((a: IOfferFormatted, b: IOfferFormatted) => {
                if (a.isClosingSoon && !b.isClosingSoon) return 1;
                if (!a.isClosingSoon && b.isClosingSoon) return -1;
                return 0;
              }),
          }
        : rawData;
      return formattedData;
    });

  const getOfferOne = async (slug: string | number) =>
    withActionState(getOfferOneState, async () => {
      const response = await apiClient.get(`/public/offer/${slug}`);
      applyOfflineHydrationMeta(getOfferOneState, response.headers);
      const offerData = response.data as IOffer;
      return offerCache.format(offerData as unknown as IOfferApp);
    });

  const getOfferComments = async (id: number) =>
    withActionState(getOfferCommentsState, async () => {
      const response = await apiClient.get(`/public/comment/${id}`);
      applyOfflineHydrationMeta(getOfferCommentsState, response.headers);
      return response.data as IOfferCommentsResponse;
    });

  const setOfferComment = async (payload: IOfferCommentPayload) =>
    withActionState(setOfferCommentState, async () => {
      const response = await apiClient.post('/auth/comment', payload);
      return response.data as {id: number};
    });

  const setOfferCommentOptions = async () =>
    withActionState(setOfferCommentOptionsState, async () => {
      const response = await apiClient.options('/auth/comment');
      return response.data;
    });

  // Helper: delegate to formatter for single source of truth (accepts API or app shape)
  const getOfferFundedPercent = (offer: IOffer | IOfferApp) =>
    offer ? offerCache.format(offer as unknown as IOfferApp).offerFundedPercent : 0;

  const updateNotificationData = (notification: INotification) => {
    const { fields } = notification.data;
    const objectId = fields?.object_id;
    if (objectId === undefined) return;

    const one = getOfferOneState.value.data;
    if (one?.id === objectId) {
      const updated = { ...one, ...fields } as IOfferApp;
      getOfferOneState.value.data = offerCache.format(updated);
    }

    const list = getOffersState.value.data;
    if (!list) return;
    const items = (list as unknown as { data?: IOfferFormatted[] })?.data;
    if (!items?.length) return;
    const index = items.findIndex((t) => t.id === objectId);
    if (index === -1) return;
    const newItems = items.map((item, i) =>
      i === index
        ? offerCache.format({ ...item, ...fields } as unknown as IOfferApp)
        : item,
    );
    getOffersState.value.data = { ...list, data: newItems } as unknown as IOfferData;
  };

  const resetAll = () => {
    offerCache.clear();
    resetActionStates();
  };

  // Returns the not-closed offer with the highest funded percent
  const getTopOpenOffer = (): IOfferFormatted | undefined => {
    const items = (getOffersState.value.data as unknown as { data?: IOfferFormatted[] })?.data;
    if (!items || items.length === 0) return undefined;
    const openOffers = items.filter((offer) => !offer.isFundingCompleted && offer.offerFundedPercent < 100);
    if (openOffers.length === 0) return undefined;
    const result = openOffers.reduce<IOfferFormatted>((best, current) => (
      current.offerFundedPercent > best.offerFundedPercent ? current : best
    ), openOffers[0]);
    return {
      ...result,
      tagText: '🔥 Hot',
      showTag: true,
      tagBackground: 'is--background-yellow-light',
    };
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
