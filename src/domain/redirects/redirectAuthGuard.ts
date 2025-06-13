import { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useUserSession } from 'InvestCommon/store/useUserSession';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import { urlSignin } from 'InvestCommon/global/links';

export const handleAuthGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  const userSessionStore = useUserSession();
  const { userLoggedIn } = storeToRefs(userSessionStore);

  if (to.meta.requiresAuth && !userLoggedIn.value) {
    const queryParams = { redirect: to.path };
    navigateWithQueryParams(urlSignin, queryParams);
  } else {
    next();
  }
};

/*
Flow cases:
- if meta.requiresAuth and not logged in user - redirect to signin
*/
