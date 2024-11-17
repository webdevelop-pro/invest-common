import {
  computed, nextTick, ref,
} from 'vue';
import { useRouter } from 'vue-router';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import { useRedirect } from 'InvestCommon/composable/useRedirect';
import {
  ROUTE_DASHBOARD_PORTFOLIO, ROUTE_CHECK_EMAIL, ROUTE_LOGIN, ROUTE_OFFERS, ROUTE_OFFERS_DETAILS,
  ROUTE_INVEST_AMOUNT, ROUTE_INVEST_FUNDING, ROUTE_INVEST_OWNERSHIP, ROUTE_INVEST_REVIEW,
  ROUTE_INVEST_SIGNATURE, ROUTE_INVEST_THANK,
} from 'InvestCommon/helpers/enums/routes';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import {
  useAccreditationStore, useAuthStore, useFilerStore, useFundingStore, useInvestmentsStore,
  useNotificationsStore, usePlaidStore,
  useProfileWalletStore, useProfileWalletTransactionStore, useUserIdentitysStore,
  useUsersStore, useGlobalLoader,
} from 'InvestCommon/store';
import env from 'InvestCommon/global';
import { navigateWithQueryParams } from 'InvestCommon/helpers/general';
import { urlOffers, urlProfilePortfolio, urlSignin } from 'InvestCommon/global/links';

const { EXTERNAL } = env;

const loading = ref(false);

// This is the store with general flow logic for auth
export const useAuthLogicStore = defineStore('authLogic', () => {
  const router = useRouter();
  const { pushTo } = useRedirect();
  const usersStore = useUsersStore();
  const { selectedUserProfileId } = storeToRefs(usersStore);

  const authStore = useAuthStore();
  const {
    setSignupData, setLoginData, getFlowData, setPasswordData, setRecoveryData,
    setSocialLoginDataError, getLogoutResponse, getLogoutURLData, getSessionData, isGetSessionError,
    getSessionErrorResponse, isSetLoginError, isGetFlowError, isSetSignupError, isSetPasswordError,
    isSetRecoveryError, isGetLogoutURLError, setVerificationErrorData,
  } = storeToRefs(authStore);

  const flowId = computed(() => getFlowData.value?.id || '');

  const csrfToken = computed(() => {
    if (getFlowData.value && getFlowData.value.ui) {
      const tokenItem = getFlowData.value.ui.nodes.find((item) => item.attributes.name === 'csrf_token');
      return tokenItem?.attributes.value ?? '';
    }
    return '';
  });

  // LOGIN
  const onLogin = async (email: string, password: string, url: string) => {
    loading.value = true;

    await authStore.fetchAuthHandler(url);
    if (isGetFlowError.value) {
      loading.value = false;
      return;
    }
    await authStore.setLogin(flowId.value, password, email, csrfToken.value);

    loading.value = false;
  };

  const handleAfterLogin = async (email: string) => {
    if (isSetLoginError.value) {
      loading.value = false;
      return;
    }
    const { submitFormToHubspot } = useHubspotForm('07463465-7f03-42d2-a85e-40cf8e29969d');
    if (setLoginData.value && setLoginData.value.session) {
      await usersStore.getUserIdentity();
      void usersStore.updateUserAccountSession(setLoginData.value.session);
      if (EXTERNAL) {
        navigateWithQueryParams(urlProfilePortfolio(selectedUserProfileId.value));
      } else {
        void router.push(pushTo({
          name: ROUTE_DASHBOARD_PORTFOLIO,
          params: { profileId: selectedUserProfileId.value },
        }));
      }

      void submitFormToHubspot({
        email,
      });
    }
  };

  // SOCIAL LOGIN
  const onSocialLogin = async (provider: string, url: string) => {
    loading.value = true;

    await authStore.fetchAuthHandler(url);
    if (isGetFlowError.value) {
      loading.value = false;
      return;
    }
    await authStore.setSocialLogin(flowId.value, provider, csrfToken.value);

    if (setSocialLoginDataError.value && setSocialLoginDataError.value?.redirect_browser_to) {
      window.location.href = setSocialLoginDataError.value.redirect_browser_to;
      // eslint-disable-next-line no-console
      console.log('setSocialLoginData', setSocialLoginDataError.value.redirect_browser_to);
    }

    loading.value = false;
  };

  // SIGNUP
  const onSignUp = async (firstName: string, lastName: string, email: string, password: string, url: string) => {
    const { submitFormToHubspot } = useHubspotForm('726ad71f-e168-467f-9847-25e9377f69cf');
    loading.value = true;

    await authStore.fetchAuthHandler(url);
    if (isGetFlowError.value) {
      loading.value = false;
      return;
    }
    await authStore.setSignup(
      flowId.value,
      password,
      firstName,
      lastName,
      email,
      csrfToken.value,
    );
    if (isSetSignupError.value) {
      loading.value = false;
      return;
    }
    if (setSignupData.value && setSignupData.value.session) {
      await usersStore.getUserIdentity();
      void usersStore.updateUserAccountSession(setSignupData.value.session);
      if (EXTERNAL) {
        navigateWithQueryParams(urlProfilePortfolio(selectedUserProfileId.value));
      } else {
        void router.push(pushTo({
          name: ROUTE_DASHBOARD_PORTFOLIO,
          params: { profileId: selectedUserProfileId.value },
        }));
      }

      void submitFormToHubspot({
        email,
        firstname: firstName,
        lastname: lastName,
      });
    }

    loading.value = false;
  };

  // RESET
  const onReset = async (password: string, url: string) => {
    await authStore.fetchAuthHandler(url);
    if (isGetFlowError.value) {
      loading.value = false;
      return;
    }
    await authStore.setPassword(flowId.value, password, csrfToken.value);
    if (isSetPasswordError.value) {
      loading.value = false;
      return;
    }
    if (setPasswordData.value) {
      if (EXTERNAL) {
        navigateWithQueryParams(urlProfilePortfolio(selectedUserProfileId.value));
      } else {
        void router.push(pushTo({
          name: ROUTE_DASHBOARD_PORTFOLIO,
          params: { profileId: selectedUserProfileId.value },
        }));
      }
    }
  };

  // RECOVERY
  const onRecovery = async (email: string, url: string) => {
    await authStore.fetchAuthHandler(url);
    if (isGetFlowError.value) {
      loading.value = false;
      return;
    }
    await authStore.setRecovery(
      flowId.value,
      email,
      csrfToken.value,
    );
    if (isSetRecoveryError.value) {
      loading.value = false;
      return;
    }
    if (setRecoveryData.value && setRecoveryData.value.state && (setRecoveryData.value.state === 'sent_email')) {
      void router.push({ name: ROUTE_CHECK_EMAIL, query: { email, flowId: flowId.value } });
    }
  };

  const resetAll = () => {
    const { userLoggedIn } = storeToRefs(useUsersStore());
    userLoggedIn.value = null;
    selectedUserProfileId.value = null;
    useFundingStore().resetAll();
    useProfileWalletTransactionStore().resetAll();
    useProfileWalletStore().resetAll();
    useUserIdentitysStore().resetAll();
    useUsersStore().resetAll();
    usePlaidStore().resetAll();
    useInvestmentsStore().resetAll();
    useAccreditationStore().resetAll();
    useAuthStore().resetAll();
    useNotificationsStore().resetAll();
    useFilerStore().resetAll();
  };


  const handleAfterLogout = () => {
    resetAll();
    let queryParams;
    if (EXTERNAL) {
      if (window?.location?.pathname?.includes('offer')) {
        queryParams = window?.location?.pathname;
      }
      if (window?.location?.pathname?.includes('/invest')) {
        queryParams = { redirect: urlOffers };
      }
      if (queryParams) navigateWithQueryParams(urlSignin, queryParams);
      else navigateWithQueryParams(urlSignin);
    } else {
      const { currentRoute } = router;
      if (currentRoute.value.name === ROUTE_OFFERS
            || currentRoute.value.name === ROUTE_OFFERS_DETAILS) {
        queryParams = { redirect: currentRoute.value.fullPath };
      }
      if ((currentRoute.value.name === ROUTE_INVEST_AMOUNT
          || currentRoute.value.name === ROUTE_INVEST_FUNDING
          || currentRoute.value.name === ROUTE_INVEST_OWNERSHIP
          || currentRoute.value.name === ROUTE_INVEST_REVIEW
          || currentRoute.value.name === ROUTE_INVEST_SIGNATURE
          || currentRoute.value.name === ROUTE_INVEST_THANK) && currentRoute.value.params?.slug) {
        queryParams = { redirect: urlOffers };
      }
      if (queryParams) navigateWithQueryParams(urlSignin, queryParams);
      else navigateWithQueryParams(urlSignin);
    }
  };

  // LOGOUT
  const isLoadingLogout = ref(false);
  const onLogout = async () => {
    const token = ref('');
    isLoadingLogout.value = true;
    // call /self-service/logout/browser, get token from response
    await authStore.getLogoutUrl();
    if (isGetLogoutURLError.value) {
      loading.value = false;
      return;
    }
    if (getLogoutURLData.value) {
      token.value = getLogoutURLData.value.logout_token
        ? getLogoutURLData.value.logout_token
        : getLogoutURLData.value.logout_url.split('token=')[1].toString();
    }

    // using token logout
    await authStore.getLogout(token.value);

    // eslint-disable-next-line max-len
    if (getLogoutResponse.value && (getLogoutResponse.value.status >= 200) && (getLogoutResponse.value.status <= 300)) {
      // if logout request is ok, reset all data and redirect
      useGlobalLoader().show();
      handleAfterLogout();
    }
    isLoadingLogout.value = false;
  };

  // SESSION
  const isLoadingSession = ref(false);
  // get session to know if user is authorized
  const getSession = async () => {
    isLoadingSession.value = true;
    await authStore.getSession();
    if (getSessionData.value && !isGetSessionError.value) {
      // await usersStore.getUserIdentity();
      await nextTick();
      void usersStore.updateUserAccountSession(getSessionData.value);
      // await notificationsHandler(); // TODO: check if needed
    } else if (!getSessionData.value || getSessionErrorResponse.value?.status === 401) {
      resetAll();
      if (EXTERNAL) {
        isLoadingSession.value = false;
      } else if (router.currentRoute.value.meta.auth) {
        navigateWithQueryParams(urlSignin);
      }
    }
    isLoadingSession.value = false;
  };


  // VERIFICATION
  const onVerification = async (flowIdVerification: string, code: string, url: string) => {
    await authStore.fetchAuthHandler(url);
    if (isGetFlowError.value) {
      loading.value = false;
      return;
    }
    await authStore.setVerification(
      flowIdVerification,
      code,
      csrfToken.value,
    );

    // eslint-disable-next-line
    if (setVerificationErrorData.value && setVerificationErrorData.value?.redirect_browser_to
    // eslint-disable-next-line
        && (setVerificationErrorData.value?.error?.code === 422)) {
      await getSession();
      // eslint-disable-next-line
      const fullUrl = setVerificationErrorData.value.redirect_browser_to;
      const newUrl = new URL(fullUrl);
      const relativePath = newUrl.pathname + newUrl.search;
      void router.replace({ path: relativePath });
    }
  };


  authStore.$onAction(
    ({
      name, // name of the action
      // eslint-disable-next-line
      store, // store instance, same as `someStore`
      args, // array of parameters passed to the action
      after, // hook after the action returns or resolves
    }) => {
      after(() => {
        switch (name) {
          case 'setLogin':
            void handleAfterLogin(args[0]);
            break;
          default:
        }
      });
    },
  );

  return {
    loading,
    isLoadingLogout,
    isLoadingSession,
    onLogin,
    onSignUp,
    onReset,
    onRecovery,
    onVerification,
    onSocialLogin,
    onLogout,
    getSession,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthLogicStore, import.meta.hot));
}
