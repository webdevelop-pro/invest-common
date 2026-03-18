import { RouteLocationNormalized } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import { urlSignin } from 'InvestCommon/domain/config/links';
import { useRepositoryAuth } from 'InvestCommon/data/auth/auth.repository';
import { resetAllData } from 'InvestCommon/domain/resetAllData';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { oryErrorHandling } from 'InvestCommon/domain/error/oryErrorHandling';
// import { useDomainWebSocketStore } from 'InvestCommon/domain/websockets/store/useWebsockets';
import { ISession } from 'InvestCommon/data/auth/auth.type';

/**
 * Shared 401 / unauthorized redirect: reset state and go to sign-in with optional return URL.
 * Used by the auth guard and by the global error handler (onUnauthorized).
 */
export async function redirectToSigninForUnauthorized(redirectPath?: string): Promise<void> {
  await resetAllData();
  const redirect = redirectPath ?? window.location.href;
  navigateWithQueryParams(urlSignin, { redirect });
}

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
    const redirectToSignin = async () => {
      // Prevent redirect loops - if we're already going to signin, don't redirect again
      if (to.path.includes('/signin') || to.path.includes('/signup')) {
        return;
      }
      await redirectToSigninForUnauthorized(`${window.location.origin}${to.fullPath}`);
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
        await redirectToSignin();
      }
      return;
    }

    // User appears logged in - verify session is still valid (with basic throttling)
    // This handles the case where cookies exist but session was invalidated elsewhere
    if (userLoggedIn.value && userSession.value) {
      const session = (await useRepositoryAuth().getSession()) as ISession | null;

      if (!session?.active) {
        // Session is invalid, clear everything and redirect if route requires auth
        await resetAllData();
        if (to.meta.requiresAuth) {
          await redirectToSignin();
        }
        return;
      }

      // Session is valid, update store if needed
      if (session && session.id !== userSession.value?.id) {
        await userSessionStore.updateSession(session);
        profilesStore.init();
      }
    }

    // Logged in but session missing: reset all data
    if (!userSession.value) {
      await resetAllData();
      return;
    }

    // Authenticated and session present: allow navigation
    return;
  } catch (error) {
    // Handle Ory-specific session errors (e.g. session_aal2_required) and generic failures.
    await oryErrorHandling(error as any, 'browser', () => {}, 'Auth guard');
    await resetAllData();
    return;
  }
};
