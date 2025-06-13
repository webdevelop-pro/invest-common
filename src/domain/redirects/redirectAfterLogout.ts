import {
  ROUTE_INVEST_AMOUNT, ROUTE_INVEST_FUNDING, ROUTE_INVEST_OWNERSHIP,
  ROUTE_INVEST_REVIEW, ROUTE_INVEST_SIGNATURE, ROUTE_INVEST_THANK,
} from 'InvestCommon/helpers/enums/routes';
import env from 'InvestCommon/global/index';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import {  urlOffers, urlSignin } from 'InvestCommon/global/links';

const { IS_STATIC_SITE } = env;

export const redirectAfterLogout = async () => {
  let queryParams;

  if (+IS_STATIC_SITE) {
    if (window?.location?.pathname?.includes('offer')) {
      queryParams = { redirect: window?.location?.pathname };
    }
    if (queryParams) {
      navigateWithQueryParams(urlSignin, queryParams);
    } else {
      navigateWithQueryParams(urlSignin);
    }
  } else {
    const { useRouter } = await import('vue-router');
    const router = useRouter();
    const { currentRoute } = router;
    
    if ((currentRoute.value.name === ROUTE_INVEST_AMOUNT
        || currentRoute.value.name === ROUTE_INVEST_FUNDING
        || currentRoute.value.name === ROUTE_INVEST_OWNERSHIP
        || currentRoute.value.name === ROUTE_INVEST_REVIEW
        || currentRoute.value.name === ROUTE_INVEST_SIGNATURE
        || currentRoute.value.name === ROUTE_INVEST_THANK) 
        && currentRoute.value.params?.slug) {
      queryParams = { redirect: urlOffers };
    }
    
    if (queryParams) {
      navigateWithQueryParams(urlSignin, queryParams);
    } else {
      navigateWithQueryParams(urlSignin);
    }
  }
};