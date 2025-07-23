import { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import { urlSignin } from 'InvestCommon/global/links';
import { useRepositoryAuth } from 'InvestCommon/data/auth/auth.repository';
import { resetAllData } from 'InvestCommon/domain/resetAllData';
import env from 'InvestCommon/global';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useDomainWebSocketStore } from 'InvestCommon/domain/websockets/store/useWebsockets';

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
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
): Promise<void> => {
  try {
    const userSessionStore = useSessionStore();
    const { userLoggedIn, userSession } = storeToRefs(userSessionStore);
    const profilesStore = useProfilesStore();
    const websocketsStore = useDomainWebSocketStore();

    // Handle unauthenticated user
    if (!userLoggedIn.value) {
      const session = await useRepositoryAuth().getSession();

      if (session) {
        await userSessionStore.updateSession(session);
        profilesStore.init();
        websocketsStore.webSocketHandler();
        return next();
      }

      if (!session?.active && to.meta.requiresAuth) {
        resetAllData();
        const redirectUrl = `${env.FRONTEND_URL}${to.fullPath}`;
        return navigateWithQueryParams(urlSignin, { redirect: redirectUrl });
      }

      return next();
    }

    // Handle authenticated user
    if (!userSession.value) {
      resetAllData();
    }

    return next();
  } catch (error) {
    console.error('Auth guard error:', error);
    resetAllData();
    return next(false);
  }
};
