import env from 'InvestCommon/global';

const { HUBSPOTFORM, HUBSPOTPORTAL_ID } = env;

export const fetchHubspotForm = (hubspotFormId: string, data: object) => {
  const path = `${HUBSPOTFORM}/${HUBSPOTPORTAL_ID}/${hubspotFormId}`;
  const body = JSON.stringify(data);

  const req = {
    body,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', accept: 'application/json' },
  };

  return fetch(path, req).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<unknown>;
  });
};
