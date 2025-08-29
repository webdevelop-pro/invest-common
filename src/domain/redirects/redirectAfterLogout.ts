import { navigateWithQueryParams } from 'UiKit/helpers/general';
import { urlOffers, urlSignin } from 'InvestCommon/domain/config/links';

export const redirectAfterLogout = async () => {
  const pathname = window?.location?.pathname ?? '';
  let queryParams;

  if (pathname.includes('offer')) {
    queryParams = { redirect: pathname };
  } else if (pathname.includes('/invest')) {
    queryParams = { redirect: urlOffers };
  }

  navigateWithQueryParams(urlSignin, queryParams);
};
