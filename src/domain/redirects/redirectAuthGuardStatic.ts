import { storeToRefs } from 'pinia';
import { useUserSession } from 'InvestCommon/store/useUserSession';
import { useRepositoryAuth } from 'InvestCommon/data/auth/auth.repository';
import {
  urlSignin, urlSignup, urlAuthenticator, urlForgot, urlCheckEmail,
  urlProfile,
} from 'InvestCommon/global/links';
import { watch } from 'vue';
import { navigateWithQueryParams } from 'UiKit/helpers/general';

const pagesToRedirectIfLoggedIn = [
  urlSignin, urlSignup, urlAuthenticator, urlForgot, urlCheckEmail,
];

const getPathnameFromUrl = (url: string) => {
  try {
    return new URL(url).pathname;
  } catch {
    return url; // fallback to original string if URL parsing fails
  }
};

export const redirectAuthGuardStatic = async () => {
  const userSessionStore = useUserSession();
  const { userLoggedIn } = storeToRefs(userSessionStore);

  const currentPathname = window.location.pathname;
  const protectedPaths = pagesToRedirectIfLoggedIn.map(getPathnameFromUrl);

  // Watch for changes in login state
  watch(() => userLoggedIn.value, async () => {
    if (!userLoggedIn.value) {
      const resp = await useRepositoryAuth().getSession();
      if (resp) {
        userSessionStore.updateSession(resp);
      }
    } else if (protectedPaths.includes(currentPathname)) {
      // Check if there's a redirect parameter in the URL
      const urlParams = new URLSearchParams(window.location.search);
      const hasRedirect = urlParams.has('redirect');

      // Only redirect to profile if there's no redirect parameter
      if (!hasRedirect) {
        navigateWithQueryParams(urlProfile());
      }
    }
  }, { immediate: true });
};
