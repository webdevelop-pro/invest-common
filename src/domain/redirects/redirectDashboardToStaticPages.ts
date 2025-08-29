import { RouteLocationNormalized } from 'vue-router';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import env from 'InvestCommon/domain/config/env';

// List of base paths that should redirect to static pages
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

/**
 * Redirects dashboard routes to static pages if the path matches certain base paths or is home.
 * @param to - The target route location
 */
export const redirectDashboardToStaticPages = (
  to: RouteLocationNormalized,
) => {
  const isHome = to.path === '/';
  // Check for exact match or dynamic paths under specified bases
  const isRedirectPath = redirectBasePaths.some(
    (base) => to.path === base || to.path.startsWith(base + '/')
  );

  if (isRedirectPath || isHome) {
    const href = `${env.FRONTEND_URL_STATIC}${to.path}`;
    navigateWithQueryParams(href, to.query);
  }
};

/*
Flow cases:
- if dashboard has link dashboard / or /signup (static page) - redirect to static page
*/
