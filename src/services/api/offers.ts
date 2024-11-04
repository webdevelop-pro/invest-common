import {
  IOffer, IOfferData, IOfferCommentsResponse, IOfferCommentPayload,
} from 'InvestCommon/types/api/offers';
import { requiredFetchParams } from 'InvestCommon/helpers/requiredFetchParams';

import env from 'InvestCommon/global';

const { OFFER_URL } = env;

export const fetchGetOffers = () => {
  const path = `${OFFER_URL}/`;

  const data = {
    method: 'GET',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<IOfferData>;
  });
};

export const fetchGetOfferOne = (slug: string | number) => {
  const path = `${OFFER_URL}/${slug}`;

  const data = {
    method: 'GET',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<IOffer>;
  });
};

export const fetchGetOfferComments = (id: number) => {
  const path = `${OFFER_URL}/comment/${id}`;

  const data = {
    method: 'GET',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<IOfferCommentsResponse>;
  });
};

export const fetchSetOfferComment = (payload: IOfferCommentPayload) => {
  const path = `${OFFER_URL}/comment`;

  const body = JSON.stringify({
    ...payload,
  });

  const data = {
    method: 'POST',
    body,
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<{id: number}>;
  });
};

export const fetchSetOfferCommentOptions = () => {
  const path = `${OFFER_URL}/comment`;

  const data = {
    method: 'OPTIONS',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json();
  });
};
