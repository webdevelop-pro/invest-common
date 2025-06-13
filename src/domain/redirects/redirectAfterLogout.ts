import { navigateWithQueryParams } from 'UiKit/helpers/general';
import { urlOffers, urlSignin } from 'InvestCommon/global/links';

export const redirectAfterLogout = async () => {
  let queryParams;

  if (window?.location?.pathname?.includes('offer')) {
    queryParams = { redirect: window?.location?.pathname };
  }
  if (window?.location?.pathname?.includes('/invest')) {
    queryParams = { redirect: urlOffers };
  }
  if (queryParams) {
    navigateWithQueryParams(urlSignin, queryParams);
  } else {
    navigateWithQueryParams(urlSignin);
  }
};
