import { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import env from 'InvestCommon/global';

export const redirectDashboardToStaticPages = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  const redirectBasePaths: string[] = [
    '/faq',
    '/how-it-works',
    '/resource-center',
    '/offers',
    '/signin',
    '/signup',
    '/forgot',
    '/check-email',
    '/contact-us',
    '/legal/terms-of-use',
    '/legal/privacy-policy',
    '/legal/cookie',
  ];
  const isRedirectPath = redirectBasePaths.some((path) => ((to.path === path) || to.path.startsWith(`${path}/`)));
  const isHome = to.path === '/';
  // Check for exact match or dynamic paths under specified bases
  if (isRedirectPath || isHome) {
    const href = `${env.FRONTEND_URL_STATIC}${to.path}`;
    navigateWithQueryParams(href, to.query);
  }
};

/*
Flow cases:
- if dashboard has link dahboard / or /signup (static page) - redirect to static page
*/
