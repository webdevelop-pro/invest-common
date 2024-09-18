import { credentialsIncludeParams, requiredFetchParams } from 'InvestCommon/helpers/requiredFetchParams';
import env from 'InvestCommon/global';

const { ACCREDITATION_URL } = env;

// START ACCREDITATION FLOW
export const fetchCreateAccreditation = (profileId: number, note: string) => {
  const path = `${ACCREDITATION_URL}/accreditation/create/${profileId}`;

  const body = JSON.stringify({
    ai_method: 'upload',
    notes: note,
  });

  const data = {
    method: 'POST',
    body,
    ...requiredFetchParams(),

  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<unknown>;
  });
};

export const fetchUpdateAccreditation = (profileId: number, note: string) => {
  const path = `${ACCREDITATION_URL}/accreditation/update/${profileId}`;

  const body = JSON.stringify({
    ai_method: 'upload',
    notes: note,
    status: 'New Info Added',
  });

  const data = {
    method: 'POST',
    body,
    ...requiredFetchParams(),

  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<unknown>;
  });
};

// UPLOAD ACCREDITATION DOCUMENTS
// eslint-disable-next-line
export const fetchUploadAccreditationDocument = (userId: number, profileId: number, formData: FormData) => {
  const path = `${ACCREDITATION_URL}/accreditation/upload_document/${userId}/${profileId}`;

  const data = {
    method: 'POST',
    body: formData,
    ...credentialsIncludeParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<unknown>;
  });
};

export const fetchCreateEscrow = (userId: number, profileId: number) => {
  const path = `${ACCREDITATION_URL}/escrow/${userId}/${profileId}`;

  const data = {
    method: 'POST',
    ...credentialsIncludeParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<unknown>;
  });
};
