import { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useUserSession } from 'InvestCommon/store/useUserSession';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import { urlSignin } from 'InvestCommon/global/links';
import { useRepositoryAuth } from 'InvestCommon/data/auth/auth.repository';

export const redirectAuthGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  const userSessionStore = useUserSession();
  const { userLoggedIn } = storeToRefs(userSessionStore);

  if (!userLoggedIn.value) {
    const resp = await useRepositoryAuth().getSession();
    if (resp) {
      userSessionStore.updateSession(resp);
      next();
    } else if (!resp?.active) {
      navigateWithQueryParams(urlSignin, { redirect: to.fullPath });
    }
  }
};

/*
Flow cases:
- if meta.requiresAuth and not logged in user - redirect to signin
*/
