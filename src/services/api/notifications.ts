import {
  INotification,
} from 'InvestCommon/types/api/notifications';
import { requiredFetchParams } from 'InvestCommon/helpers/requiredFetchParams';

import env from 'InvestCommon/global';

const { NOTIFICATION_URL } = env;

export const fetchGetNotificationsAll = () => {
  const path = `${NOTIFICATION_URL}/notification`;

  const data = {
    method: 'GET',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<INotification[]>;
  });
};

export const fetchMarkNotificationReadById = (notification_id: number) => {
  const path = `${NOTIFICATION_URL}/notification/${notification_id}`;

  const data = {
    method: 'PUT',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json();
  });
};

export const fetchMarkNotificationReadAll = () => {
  const path = `${NOTIFICATION_URL}/notification/all`;

  const data = {
    method: 'PUT',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json();
  });
};
