import env from 'InvestCommon/domain/config/env';
import { requiredFetchParams } from 'UiKit/helpers/api/requiredFetchParams';
import { IFilerItem } from 'InvestCommon/types/api/filer.type';

const { FILER_URL } = env;

export const fetchGetFiles = (object_id: number | string, object_name: string) => {
  const path = `${FILER_URL}/auth/objects/${object_name}/${object_id}`;

  const data = {
    method: 'GET',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<IFilerItem[]>;
  });
};

export const fetchGetPublicFiles = (object_id: number | string, object_name: string) => {
  const path = `${FILER_URL}/public/objects/${object_name}/${object_id}`;

  const data = {
    method: 'GET',
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<IFilerItem[]>;
  });
};

export const fetchPostSignurl = (body: object) => {
  const path = `${FILER_URL}/auth/files/signurl`;

  const data = {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    credentials: 'include' as RequestCredentials,
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<IFilerItem[]>;
  });
};

export const uploadFile = (file: File, type: string, uploadData: object) => new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest();
  xhr.open('PUT', uploadData.url, true);
  xhr.setRequestHeader('Content-Type', type);
  xhr.setRequestHeader('x-goog-meta-file-id', uploadData.fileId);
  // xhr.setRequestHeader('x-goog-meta-user_id', +uploadData.userId);
  // xhr.setRequestHeader('x-goog-meta-object-id', uploadData.objectId);
  // xhr.setRequestHeader('x-goog-meta-object-name', uploadData.objectName);
  // xhr.setRequestHeader('x-goog-meta-object-type', 'one2one');
  /*
    xhr.setRequestHeader(
      'x-goog-meta-object-data',
      JSON.stringify({ type: 'company' }),
    );
    */
  xhr.send(file);

  xhr.onload = function () {
    if (xhr.status === 200) {
      resolve('success');
    } else {
      reject(new Error('failed'));
    }
  };

  xhr.onerror = function () {
    reject(new Error('failed'));
  };
});

export const fetchGetImageByIdLink = (id: number | string) => {
  const path = `${FILER_URL}/auth/files/${id}?size=small`;

  const data = {
    method: 'GET',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<IFilerItem[]>;
  });
};
