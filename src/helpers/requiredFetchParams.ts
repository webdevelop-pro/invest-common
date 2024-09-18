import { v4 as uuidv4 } from 'uuid';

export const requiredFetchParams = () => ({
  headers: {
    'Content-Type': 'application/json',
    accept: 'application/json',
    // eslint-disable-next-line
    'X-Request-ID': uuidv4() as string,
  },
  credentials: 'include' as RequestCredentials,
});

export const requiredFetchParamsSimple = () => ({
  headers: {
    'Content-Type': 'application/json',
    accept: 'application/json',
  },
  credentials: 'include' as RequestCredentials,
});

export const credentialsIncludeParams = () => ({
  headers: {
    // eslint-disable-next-line
    'X-Request-ID': uuidv4() as string,
  },
  credentials: 'include' as RequestCredentials,
});
