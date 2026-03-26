import { APIError } from 'InvestCommon/data/service/handlers/apiError';

const OFFLINE_READ_ERROR_MESSAGES = [
  'failed to fetch',
  'load failed',
  'network request failed',
  'networkerror when attempting to fetch resource',
] as const;

export const isBrowserOffline = () => (
  typeof navigator !== 'undefined' && navigator.onLine === false
);

export const isOfflineReadFailure = (error?: unknown) => {
  if (isBrowserOffline()) {
    return true;
  }

  if (!(error instanceof Error) || error instanceof APIError) {
    return false;
  }

  const errorMessage = error.message.toLowerCase();
  return OFFLINE_READ_ERROR_MESSAGES.some((candidate) => errorMessage.includes(candidate));
};

