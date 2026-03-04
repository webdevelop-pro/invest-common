import { navigateWithQueryParams } from 'UiKit/helpers/general';
import { urlOffers, urlSignin } from 'InvestCommon/domain/config/links';

export const redirectAfterLogout = async () => {
  const pathname = window?.location?.pathname ?? '';
  let queryParams;

  // If user was on an offer/static offer-like page, return them there after signin
  if (/^\/offers?(\/|$)/.test(pathname)) {
    queryParams = { redirect: pathname };
  }
  // If user was in the invest flow, send them to the main offers page after signin
  else if (pathname.startsWith('/invest')) {
    queryParams = { redirect: urlOffers };
  }

  navigateWithQueryParams(urlSignin, queryParams);
};
