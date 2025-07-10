import { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import env from 'InvestCommon/global';

export const redirectDashboardToStaticPages = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  if (!to.meta.requiresAuth) {
    // const href = `${env.FRONTEND_URL_STATIC}${to.path}`;
    // navigateWithQueryParams(href, to.query);
  } else {
    next();
  }
};

/*
Flow cases:
- if dashboard has link dahboard / or /signup (static page) - redirect to static page
*/
