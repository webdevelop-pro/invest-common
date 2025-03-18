import {
  IInvest, IInvestData, IInvestUnconfirmed, IInvestConfirm, IInvestDocumentSign,
  IInvestFunding,
} from 'InvestCommon/types/api/invest';
import { requiredFetchParams } from 'InvestCommon/helpers/requiredFetchParams';
import env from 'InvestCommon/global';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { v4 as uuidv4 } from 'uuid';
import { storeToRefs } from 'pinia';

const { INVESTMENT_URL, ESIGN_URL } = env;

export const fetchGetInvestments = (id: string) => {
  const path = `${INVESTMENT_URL}/auth/investment/${id}/confirmed`;

  const data = {
    method: 'GET',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<IInvestData>;
  });
};

export const fetchGetInvestOne = (id: string) => {
  const path = `${INVESTMENT_URL}/auth/investment/${id}`;

  const data = {
    method: 'GET',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<IInvest>;
  });
};

export const fetchGetInvestUnconfirmed = () => {
  const path = `${INVESTMENT_URL}/auth/investment/unconfirmed`;

  const data = {
    method: 'GET',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<IInvestUnconfirmed>;
  });
};

export const fetchSetInvest = (
  slug: string,
  sharesCount: number,
) => {
  const path = `${INVESTMENT_URL}/auth/invest/${slug}`;

  const body = JSON.stringify({
    number_of_shares: sharesCount,
  });

  const data = {
    method: 'POST',
    body,
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<IInvest>;
  });
};

export const fetchSetAmount = (
  slug: string,
  id: string,
  profileId: string,
  shares: number,
) => {
  const path = `${INVESTMENT_URL}/auth/invest/${slug}/amount/${id}/${profileId}`;

  const body = JSON.stringify({
    number_of_shares: shares,
  });

  const data = {
    method: 'PUT',
    body,
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<{number_of_shares: number}>;
  });
};

export const fetchSetOwnership = (
  slug: string,
  id: string,
  profileId: string,
) => {
  const path = `${INVESTMENT_URL}/auth/invest/${slug}/ownership/${id}/${profileId}`;

  const body = JSON.stringify({});

  const data = {
    method: 'PUT',
    body,
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<{step: string}>;
  });
};

export const fetchSetSignature = (
  slug: string,
  id: string,
  profileId: string,
  signUrlId: string,
) => {
  const usersStore = useUsersStore();
  const { userAccountSession } = storeToRefs(usersStore);

  const path = `${INVESTMENT_URL}/auth/invest/${slug}/signature/${id}/${profileId}`;

  const body = JSON.stringify({
    signature_id: signUrlId,
    user_browser: userAccountSession.value?.devices[0].user_agent || '',
    ip_address: userAccountSession.value?.devices[0].ip_address || '',
  });

  const data = {
    method: 'PUT',
    body,
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json();
  });
};

export const fetchSetDocument = (
  slug: string,
  investId: string,
  profileId: string,
) => {
  const path = `${ESIGN_URL}/auth/create_document/${slug}/esign/${investId}/${profileId}`;

  const data = {
    method: 'POST',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<IInvestDocumentSign>;
  });
};

export const fetchGetDocument = (
  investId: string,
) => {
  const path = `${ESIGN_URL}/auth/get_document/${investId}`;

  const data = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/pdf',
      accept: 'application/pdf',
      'X-Request-ID': uuidv4() as string,
    },
    credentials: 'include' as RequestCredentials,
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.blob();
  });
};

export const fetchSetFunding = (
  slug: string,
  id: string,
  profileId: string,
  fundingData: IInvestFunding,
) => {
  const path = `${INVESTMENT_URL}/auth/invest/${slug}/funding/${id}/${profileId}`;

  const body = JSON.stringify(fundingData);

  const data = {
    method: 'PUT',
    body,
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json();
  });
};

export const fetchSetReview = (
  slug: string,
  id: string,
  profileId: string,
) => {
  const path = `${INVESTMENT_URL}/auth/invest/${slug}/review/${id}/${profileId}`;

  const body = JSON.stringify({
  });

  const data = {
    method: 'PUT',
    body,
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<IInvestConfirm>;
  });
};

export const fetchCancelInvest = (id: string, reason: string) => {
  const path = `${INVESTMENT_URL}/auth/investment/${id}/cancel`;

  const body = JSON.stringify({
    cancelation_reason: reason,
  });

  const data = {
    method: 'PUT',
    body,
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json();
  });
};

export const fetchSetAmountOptions = (
  slug: string,
  id: string,
  profileId: string,
) => {
  const path = `${INVESTMENT_URL}/auth/invest/${slug}/amount/${id}/${profileId}`;

  const data = {
    method: 'OPTIONS',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json();
  });
};

export const fetchSetOwnershipOptions = (
  slug: string,
  id: string,
  profileId: string,
) => {
  const path = `${INVESTMENT_URL}/auth/invest/${slug}/ownership/${id}/${profileId}`;

  const data = {
    method: 'OPTIONS',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json();
  });
};

export const fetchSetFundingOptions = (
  slug: string,
  id: string,
  profileId: string,
) => {
  const path = `${INVESTMENT_URL}/auth/invest/${slug}/funding/${id}/${profileId}`;

  const data = {
    method: 'OPTIONS',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json();
  });
};

export const fetchSetCancelOptions = (
  id: string,
) => {
  const path = `${INVESTMENT_URL}/auth/investment/${id}/cancel`;

  const data = {
    method: 'OPTIONS',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json();
  });
};
