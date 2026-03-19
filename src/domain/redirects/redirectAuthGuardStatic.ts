// import { storeToRefs } from 'pinia';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryAuth } from 'InvestCommon/data/auth/auth.repository';
import { ISession } from 'InvestCommon/data/auth/auth.type';
import {
  urlAuthenticator,
  // urlSignin, urlSignup, urlForgot, urlCheckEmail,
  // urlProfile,
} from 'InvestCommon/domain/config/links';
import { oryErrorHandling } from 'InvestCommon/domain/error/oryErrorHandling';
import { shouldPreserveOfflineSession } from './authGuardOffline';
// import { navigateWithQueryParams } from 'UiKit/helpers/general';

// const pagesToRedirectIfLoggedIn = [
//   urlSignin, urlSignup, urlAuthenticator, urlForgot, urlCheckEmail,
// ];

// TODO: add redirect for auth

export const redirectAuthGuardStatic = async () => {
  // Skip during SSR (server-side rendering)
  if (typeof window === 'undefined') {
    return;
  }

  const userSessionStore = useSessionStore();
  // const { userLoggedIn } = storeToRefs(userSessionStore);
  const getLocalSession = () => (userSessionStore.userSession as ISession | null | undefined);

  try {
    // Skip session check if we're on the authenticator page
    if (window.location.pathname !== '/' && urlAuthenticator.includes(window.location.pathname)) {
      return;
    }

    if (shouldPreserveOfflineSession(getLocalSession())) {
      return;
    }

    // Check session (repository returns null on 401 — we clear session here)
    const resp = await useRepositoryAuth().getSession();
    if (resp) {
      userSessionStore.updateSession(resp);
    } else {
      userSessionStore.resetAll();
    }

    // Only redirect if user is logged in and on a protected path
    // if (userLoggedIn.value && protectedPaths.includes(currentPathname)) {
    //   // Check if there's a redirect parameter in the URL
    //   const urlParams = new URLSearchParams(window.location.search);
    //   const hasRedirect = urlParams.has('redirect');

    //   // Only redirect to profile if there's no redirect parameter
    //   if (!hasRedirect) {
    //     navigateWithQueryParams(urlProfile());
    //   }
    // }
  } catch (error) {
    if (shouldPreserveOfflineSession(getLocalSession(), error)) {
      return;
    }

    // Handle Ory-specific session errors (e.g. session_aal2_required) and generic failures.
    await oryErrorHandling(error as any, 'browser', () => {}, 'Auth guard (static)');
  }
};
