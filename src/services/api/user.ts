import env from 'InvestCommon/global';
import { IProfileData, IUserIdentityResponse } from 'InvestCommon/types/api/invest';
import { requiredFetchParams } from 'InvestCommon/helpers/requiredFetchParams';
import { IProfileIndividual, ISchema } from 'InvestCommon/types/api/user';

const { USER_URL } = env;


export const fetchProfileOptions = (type: string) => {
  const path = `${USER_URL}/auth/profile/${type}`;
  const data = {
    method: 'OPTIONS',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<ISchema>;
  });
};

export const fetchSetProfile = (userData: object, type: string) => {
  const path = `${USER_URL}/auth/profile/${type}`;

  const body = JSON.stringify({
    ...userData,
  });

  const data = {
    method: 'POST',
    body,
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<IProfileData>;
  });
};

export const fetchProfileByIDOptions = (type: string, id: string | number) => {
  const path = `${USER_URL}/auth/profile/${type}/${id}`;

  const data = {
    method: 'OPTIONS',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<IProfileIndividual>;
  });
};

export const fetchSetProfileByID = (userData: object, type: string, id: string | number) => {
  const path = `${USER_URL}/auth/profile/${type}/${id}`;

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
    return response.json() as Promise<IProfileIndividual>;
  });
};

export const fetchGetProfileByID = (type: string, id: string | number) => {
  const path = `${USER_URL}/auth/profile/${type}/${id}`;

  const data = {
    method: 'GET',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<IProfileIndividual>;
  });
};

export const fetchGetUser = () => {
  const path = `${USER_URL}/auth/user`;

  const data = {
    method: 'GET',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<IUserIdentityResponse>;
  });
};

export const fetchSetUser = (userData: object) => {
  const path = `${USER_URL}/auth/user`;

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

export const fetchSetUserOptions = () => {
  const path = `${USER_URL}/auth/user`;

  const data = {
    method: 'OPTIONS',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json();
  });
};
