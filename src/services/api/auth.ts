import {
  IGetAuthFlow, ISetLoginOk, IGetLogoutURL, ISetSignUpOK, IRecovery,
  ISession, IGetSettingsOk, IGetSignup, IRecovery422,
} from 'InvestCommon/types/api/auth';
import { requiredFetchParams } from 'InvestCommon/helpers/requiredFetchParams';
import env from 'InvestCommon/global';

const { KRATOS_URL, FRONTEND_URL } = env;

// GET AUTH BROWSER
export const fetchAuthFlow = (url: string) => {
  const path = `${KRATOS_URL}/${url}`;

  const data = {
    method: 'GET',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<IGetAuthFlow>;
  });
};


// SET LOGIN
export const fetchSetLogin = (
  flowId: string,
  password: string,
  email: string,
  csrf_token: string,
) => {
  const path = `${KRATOS_URL}/self-service/login?flow=${flowId}`;

  const body = JSON.stringify({
    csrf_token,
    password_identifier: email,
    password,
    method: 'password',
  });

  const data = {
    method: 'POST',
    body,
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<ISetLoginOk>;
  });
};

export const fetchSetSocialLogin = (
  flowId: string,
  provider: string,
  csrf_token: string,
) => {
  const path = `${KRATOS_URL}/self-service/login?flow=${flowId}&return_to=${FRONTEND_URL}`;

  const body = JSON.stringify({
    csrf_token,
    provider,
    method: 'oidc',
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

// GET LOGOUT
export const fetchGetLogout = (token: string) => {
  const path = `${KRATOS_URL}/self-service/logout?token=${token}`;

  const data = {
    method: 'GET',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response;
  });
};


// GET LOGOUT URL
export const fetchGetLogoutURL = () => {
  const path = `${KRATOS_URL}/self-service/logout/browser`;


  const data = {
    method: 'GET',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<IGetLogoutURL>;
  });
};

// GET LOGOUT URL
export const fetchGetSignUp = (flowId: string) => {
  const path = `${KRATOS_URL}/self-service/registration?flow=${flowId}`;

  const data = {
    method: 'GET',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<IGetSignup>;
  });
};

// SET SIGNUP
export const fetchSetSignUp = (
  flowId: string,
  password: string,
  firstName: string,
  lastName: string,
  email: string,
  csrf_token: string,
) => {
  const kratosPath = `${KRATOS_URL}/self-service/registration?flow=${flowId}`;

  const kratosBody = JSON.stringify({
    csrf_token,
    traits: {
      email,
      first_name: firstName,
      last_name: lastName,
    },
    password,
    method: 'password',
  });

  const kratosData = {
    method: 'POST',
    body: kratosBody,
    ...requiredFetchParams(),
  };

  // ToDo
  // fix do using ory hooks
  return fetch(kratosPath, kratosData).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<ISetSignUpOK>;
  });
};

// SET RECOVERY
export const fetchSetRecovery = (
  flowId: string,
  email: string,
  csrf_token: string,
) => {
  const path = `${KRATOS_URL}/self-service/recovery?flow=${flowId}`;

  const body = JSON.stringify({
    csrf_token,
    email,
    method: 'code',
  });

  const data = {
    method: 'POST',
    body,
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<IRecovery>;
  });
};

// SET VERIFICATION
export const fetchSetVerification = (
  flowId: string,
  code: string,
  csrf_token: string,
) => {
  const path = `${KRATOS_URL}/self-service/recovery?flow=${flowId}`;

  const body = JSON.stringify({
    csrf_token,
    code,
    method: 'code',
  });

  const data = {
    method: 'POST',
    body,
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<IRecovery422>;
  });
};

// GET SESSION
export const fetchGetSession = () => {
  const path = `${KRATOS_URL}/sessions/whoami`;

  const data = {
    method: 'GET',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<ISession>;
  });
};

// GET ALL SESSION
export const fetchGetAllSession = () => {
  const path = `${KRATOS_URL}/sessions`;

  const data = {
    method: 'GET',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<unknown>;
  });
};

// GET SETTINGS URL
export const fetchGetSettingsURL = () => {
  const path = `${KRATOS_URL}/self-service/settings/api`;

  const data = {
    method: 'GET',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<IGetSettingsOk>;
  });
};

// SET PASSWORD
export const fetchSetPassword = (
  flowId: string,
  password: string,
  csrf_token: string,
) => {
  const path = `${KRATOS_URL}/self-service/settings?flow=${flowId}`;

  const body = JSON.stringify({
    csrf_token,
    // password_identifier: email,
    password,
    method: 'password',
  });

  const data = {
    method: 'POST',
    body,
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<IGetSettingsOk>;
  });
};


// SET PROFILE
export const fetchSetProfile = (
  flowId: string,
  traits: object,
  csrf_token: string,
) => {
  const path = `${KRATOS_URL}/self-service/settings?flow=${flowId}`;

  const body = JSON.stringify({
    csrf_token,
    method: 'profile',
    traits,
  });

  const data = {
    method: 'POST',
    body,
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json() as Promise<IGetSettingsOk>;
  });
};


// GET OPTIONS
export const fetchGetSchema = () => {
  const path = `${KRATOS_URL}/schemas`;
  const data = {
    method: 'GET',
    ...requiredFetchParams(),
  };

  return fetch(path, data).then((response) => {
    if (!response.ok) return Promise.reject(response);
    return response.json();
  });
};