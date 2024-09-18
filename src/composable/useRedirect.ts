import { getSearchParamsByUrl } from 'InvestCommon/helpers/url';
import { useRoute, RouteLocationRaw } from 'vue-router';

export const useRedirect = () => {
  const route = useRoute();

  const pushTo = (params: RouteLocationRaw) => {
    if (route?.query?.redirect) {
      const redirect = route?.query?.redirect as string;
      return {
        path: redirect,
        query: getSearchParamsByUrl(redirect),
      };
    }
    return params;
  };

  return {
    pushTo,
  };
};
