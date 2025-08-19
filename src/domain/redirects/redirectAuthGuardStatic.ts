// import { storeToRefs } from 'pinia';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryAuth } from 'InvestCommon/data/auth/auth.repository';
import {
  urlAuthenticator,
  // urlSignin, urlSignup, urlForgot, urlCheckEmail,
  // urlProfile,
} from 'InvestCommon/global/links';
// import { navigateWithQueryParams } from 'UiKit/helpers/general';

// const pagesToRedirectIfLoggedIn = [
//   urlSignin, urlSignup, urlAuthenticator, urlForgot, urlCheckEmail,
// ];

export const redirectAuthGuardStatic = async () => {
  const userSessionStore = useSessionStore();
  // const { userLoggedIn } = storeToRefs(userSessionStore);

  try {
    // Skip session check if we're on the authenticator page
    if (window.location.pathname !== '/' && urlAuthenticator.includes(window.location.pathname)) {
      return;
    }

    // Check session
    const resp = await useRepositoryAuth().getSession();
    if (resp) {
      userSessionStore.updateSession(resp);
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
    // If we get a 403 or other error, don't redirect
    console.error('Auth guard error:', error);
  }
};
