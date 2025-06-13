import { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useUserSession } from 'InvestCommon/store/useUserSession';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import { urlSignin } from 'InvestCommon/global/links';
import { useAuthLogicStore } from 'InvestCommon/store/useAuthLogic';
import { useAuthStore } from 'InvestCommon/store/useAuth';

export const redirectAuthGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  const userSessionStore = useUserSession();
  const { userLoggedIn } = storeToRefs(userSessionStore);
  const authStore = useAuthStore();
  const { getSessionData, getSessionErrorResponse } = storeToRefs(authStore);

  if (to.meta.requiresAuth && !userLoggedIn.value) {
    await useAuthLogicStore().getSession();
    if (!getSessionData.value?.active || getSessionErrorResponse.value) {
      navigateWithQueryParams(urlSignin, { redirect: to.fullPath });
    }
  } else {
    useAuthLogicStore().getSession();
    next();
  }
};

/*
Flow cases:
- if meta.requiresAuth and not logged in user - redirect to signin
*/
