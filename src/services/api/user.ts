import env from 'InvestCommon/global';
import { IProfileData, IUserIdentityResponse } from 'InvestCommon/types/api/invest';
import { requiredFetchParams } from 'InvestCommon/helpers/requiredFetchParams';
import { IProfileIndividual, ISchema } from 'InvestCommon/types/api/user';

const { USER_URL } = env;

export const fetchGetUserIndividualProfile = () => {
  const path = `${USER_URL}/profile/individual`;

  const data = {
    method: 'GET',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<IProfileIndividual>;
  });
};

export const fetchSetUserIndividualProfile = (userData: object) => {
  const path = `${USER_URL}/profile/individual`;

  const body = JSON.stringify({
    ...userData,
  });

  const data = {
    method: 'PATCH',
    body,
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<IProfileData>;
  });
};


export const fetchSetUserIndividualProfileOptions = () => {
  const path = `${USER_URL}/profile/individual`;
  const data = {
    method: 'OPTIONS',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<ISchema>;
  });
};

export const fetchGetUserIdentity = () => {
  const path = `${USER_URL}/user`;

  const data = {
    method: 'GET',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<IUserIdentityResponse>;
  });
};

export const fetchSetUserBackgroundInfo = (userData: object) => {
  const path = `${USER_URL}/user`;

  const body = JSON.stringify({
    ...userData,
  });

  const data = {
    method: 'PATCH',
    body,
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<IProfileData>;
  });
};

export const fetchSetUserBackgroundInfoOptions = () => {
  const path = `${USER_URL}/user`;

  const data = {
    method: 'OPTIONS',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json();
  });
};
