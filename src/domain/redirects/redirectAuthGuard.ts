import { RouteLocationNormalized } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import { urlSignin } from 'InvestCommon/global/links';
import { useRepositoryAuth } from 'InvestCommon/data/auth/auth.repository';
import { resetAllData } from 'InvestCommon/domain/resetAllData';
import env from 'InvestCommon/global';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
// import { useDomainWebSocketStore } from 'InvestCommon/domain/websockets/store/useWebsockets';
import { ISession } from 'InvestCommon/types/api/auth';

/**
 * Handles authentication and session management for route navigation
 *
 * Flow cases:
 * 1. User not logged in:
 *    - Attempts to get session from server
 *    - If session exists, updates store and continues
 *    - If no session and route requires auth, redirects to signin
 * 2. User logged in:
 *    - If no session data, resets all data
 *    - Otherwise continues navigation
 */
export const redirectAuthGuard = async (
  to: RouteLocationNormalized,
): Promise<void> => {
  try {
    const userSessionStore = useSessionStore();
    const { userLoggedIn, userSession } = storeToRefs(userSessionStore);
    const profilesStore = useProfilesStore();
    // const websocketsStore = useDomainWebSocketStore();

    // Helper for redirecting to signin
    const redirectToSignin = () => {
      resetAllData();
      const redirectUrl = `${env.FRONTEND_URL}${to.fullPath}`;
      navigateWithQueryParams(urlSignin, { redirect: redirectUrl });
    };

    // Not logged in: try to get session from server
    if (!userLoggedIn.value) {
      const session = (await useRepositoryAuth().getSession()) as ISession | null;

      if (session?.active) {
        await userSessionStore.updateSession(session);
        profilesStore.init();
        return;
      }

      if (to.meta.requiresAuth) {
        redirectToSignin();
      }
      return;
    }

    // Logged in but session missing: reset all data
    if (!userSession.value) {
      resetAllData();
      return;
    }

    // Authenticated and session present: allow navigation
    return;
  } catch (error) {
    console.error('Auth guard error:', error);
    resetAllData();
    return;
  }
};
