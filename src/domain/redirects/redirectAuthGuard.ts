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
  const repositoryAuthStore = useRepositoryAuth();
  const { getSessionState } = storeToRefs(repositoryAuthStore);

  if (to.meta.requiresAuth && !userLoggedIn.value) {
    await useRepositoryAuth().getSession();
    if (!getSessionState.value?.data?.active || getSessionState.value?.error) {
      console.log(getSessionState.value)
      // navigateWithQueryParams(urlSignin, { redirect: to.fullPath });
    }
  } else {
    useRepositoryAuth().getSession();
    next();
  }
};

/*
Flow cases:
- if meta.requiresAuth and not logged in user - redirect to signin
*/
