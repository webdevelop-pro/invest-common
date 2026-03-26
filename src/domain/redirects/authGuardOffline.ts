import type { ISession } from 'InvestCommon/data/auth/auth.type';
import { isBrowserOffline, isOfflineReadFailure } from 'InvestCommon/domain/pwa/offlineRead';

export const hasActiveLocalSession = (session?: ISession | null) => Boolean(session?.active);

export const shouldPreserveOfflineSession = (
  session?: ISession | null,
  error?: unknown,
) => {
  if (!hasActiveLocalSession(session)) {
    return false;
  }

  if (isBrowserOffline()) {
    return true;
  }

  return isOfflineReadFailure(error);
};
