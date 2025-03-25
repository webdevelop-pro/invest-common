import {
  computed, ref,
} from 'vue';
import { useRouter } from 'vue-router';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import {
  ROUTE_OFFERS, ROUTE_OFFERS_DETAILS,
  ROUTE_INVEST_AMOUNT, ROUTE_INVEST_FUNDING, ROUTE_INVEST_OWNERSHIP, ROUTE_INVEST_REVIEW,
  ROUTE_INVEST_SIGNATURE, ROUTE_INVEST_THANK,
} from 'InvestCommon/helpers/enums/routes';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import {
  useAccreditationStore, useAuthStore, useFilerStore, useFundingStore, useInvestmentsStore,
  useNotificationsStore, usePlaidStore,
  useProfileWalletStore, useProfileWalletTransactionStore, useUserProfilesStore,
  useUsersStore, useGlobalLoader,
} from 'InvestCommon/store';
import env, { cookiesOptions } from 'InvestCommon/global/index';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import {
  urlOffers, urlSignin, urlCheckEmail, urlProfile,
  urlSettings,
} from 'InvestCommon/global/links';
import { useCookies } from '@vueuse/integrations/useCookies';
import { useToast } from 'UiKit/components/Base/VToast/use-toast';

const { EXTERNAL } = env;

const loading = ref(false);

// This is the store with general flow logic for auth
export const useAuthLogicStore = defineStore('authLogic', () => {
  const router = useRouter();
  const usersStore = useUsersStore();
  const cookies = useCookies(['session']);
  const { toast } = useToast();

  const authStore = useAuthStore();
  const {
    setSignupData, setLoginData, getFlowData, setPasswordData, setRecoveryData,
    setSocialLoginDataError, getLogoutResponse, getLogoutURLData, getSessionData, isGetSessionError,
    getSessionErrorResponse, isSetLoginError, isGetFlowError, isSetSignupError, isSetPasswordError,
    isSetRecoveryError, isGetLogoutURLError, setVerificationErrorData, setSocialSignupDataError,
    setSettingsErrorData, isSetSettingsError, setPasswordErrorData,
    getSignupData,
  } = storeToRefs(authStore);

  const flowId = computed(() => getSignupData.value?.id || getFlowData.value?.id || '');

  const csrfToken = computed(() => {
    const res = getSignupData.value?.ui || getFlowData.value.ui;
    if (res) {
      const tokenItem = res.nodes.find((item) => item.attributes.name === 'csrf_token');
      return tokenItem?.attributes.value ?? '';
    }
    return '';
  });

  // LOGIN
  const onLogin = async (email: string, password: string, url: string, refresh: boolean) => {
    loading.value = true;

    await authStore.fetchAuthHandler(url, refresh);
    if (isGetFlowError.value) {
      loading.value = false;
      return;
    }
    await authStore.setLogin(flowId.value, password, email, csrfToken.value);

    if (isSetLoginError.value) {
      loading.value = false;
      return;
    }
    const { submitFormToHubspot } = useHubspotForm('07463465-7f03-42d2-a85e-40cf8e29969d');
    if (setLoginData.value && setLoginData.value.session) {
      submitFormToHubspot({ email });
      const queryRedirect = computed(() => new URLSearchParams(window.location.search).get('redirect'));
      navigateWithQueryParams(queryRedirect.value || urlProfile());

      // just set cookies. if use updateUserAccountSession -> get user will be triggered
      cookies.set(
        'session',
        setLoginData.value.session,
        cookiesOptions(new Date(setLoginData.value.session?.expires_at)),
      );
    }

    loading.value = false;
  };

  // SOCIAL LOGIN
  const onSocialLogin = async (provider: string, url: string, queryFlow?: string) => {
    loading.value = true;

    if (!queryFlow) {
      await authStore.fetchAuthHandler(url);
      if (isGetFlowError.value) {
        loading.value = false;
        return;
      }
      await authStore.setSocialLogin(flowId.value, provider, csrfToken.value);
    } else {
      await authStore.setSocialLogin(queryFlow, provider, csrfToken.value);
    }

    if (setSocialLoginDataError.value && setSocialLoginDataError.value?.redirect_browser_to) {
      window.location.href = setSocialLoginDataError.value.redirect_browser_to;

      console.log('setSocialLoginData', setSocialLoginDataError.value.redirect_browser_to);
    }

    loading.value = false;
  };

  // SOCIAL LOGIN
  const onSocialSignup = async (provider: string, url: string, traits: object, queryFlow?: string) => {
    loading.value = true;

    if (!queryFlow) {
      await authStore.fetchAuthHandler(url);
      if (isGetFlowError.value) {
        loading.value = false;
        return;
      }
      await authStore.setSocialSignup(flowId.value, provider, traits, csrfToken.value);
    } else {
      await authStore.setSocialSignup(queryFlow, provider, traits, csrfToken.value);
    }

    if (setSocialSignupDataError.value && setSocialSignupDataError.value?.redirect_browser_to) {
      window.location.href = setSocialSignupDataError.value.redirect_browser_to;

      console.log('setSocialSignupData', setSocialSignupDataError.value.redirect_browser_to);
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
      cookies.set(
        'session',
        setLoginData.value.session,
        cookiesOptions(new Date(setLoginData.value.session?.expires_at)),
      );

      submitFormToHubspot({
        email,
        firstname: firstName,
        lastname: lastName,
      });
      const queryRedirect = computed(() => new URLSearchParams(window.location.search).get('redirect'));
      if (EXTERNAL) {
        navigateWithQueryParams(queryRedirect.value || urlProfile());
      }
    }

    loading.value = false;
  };

  const refreshRedirect = () => {
    const query: Record<string, string> = {
      refresh: 'true',
      redirect: urlSettings.toString(),
    };
    navigateWithQueryParams(urlSignin, query);
  };

  // RESET
  const onReset = async (password: string, url: string) => {
    loading.value = true;
    await authStore.fetchAuthHandler(url);
    if (isGetFlowError.value) {
      loading.value = false;
      return;
    }
    await authStore.setPassword(flowId.value, password, csrfToken.value);

    if (isSetPasswordError.value && setPasswordErrorData.value?.error?.id === 'session_refresh_required') {
      refreshRedirect();
    }
    if (isSetPasswordError.value) {
      loading.value = false;
      return;
    }
    if (setPasswordData.value) {
      toast({
        title: 'Submitted',
        description: 'Password reset success',
        variant: 'success',
      });
    }
    loading.value = false;
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
      navigateWithQueryParams(urlCheckEmail, { email, flowId: flowId.value });
    }
  };

  const onSettingsSocial = async (url: string, data: any) => {
    await authStore.fetchAuthHandler(url);
    if (isGetFlowError.value) {
      loading.value = false;
      return;
    }
    await authStore.setSettings(flowId.value, data, csrfToken.value);

    if (setSettingsErrorData.value && setSettingsErrorData.value?.error?.id === 'session_refresh_required') {
      refreshRedirect();
    }
    if (setSettingsErrorData.value && setSettingsErrorData.value?.redirect_browser_to) {
      window.location.href = setSettingsErrorData.value.redirect_browser_to;

      console.log('setSocialSettings', setSettingsErrorData.value.redirect_browser_to);
    }
    if (isSetSettingsError.value) {
      loading.value = false;
    }
  };

  const setSettingsTOTP = async (url: string, data: any) => {
    await authStore.fetchAuthHandler(url);
    if (isGetFlowError.value) {
      loading.value = false;
      return;
    }
    await authStore.setSettings(flowId.value, data, csrfToken.value);

    if (setSettingsErrorData.value && setSettingsErrorData.value?.error?.id === 'session_refresh_required') {
      refreshRedirect();
    }

    if (isSetSettingsError.value) {
      loading.value = false;
    }

    await authStore.getSettings(flowId.value);
  };

  const resetAll = () => {
    useFundingStore().resetAll();
    useProfileWalletTransactionStore().resetAll();
    useProfileWalletStore().resetAll();
    useUserProfilesStore().resetAll();
    useUsersStore().resetAll();
    usePlaidStore().resetAll();
    useInvestmentsStore().resetAll();
    useAccreditationStore().resetAll();
    useAuthStore().resetAll();
    useNotificationsStore().resetAll();
    useFilerStore().resetAll();
    cookies.remove('session', cookiesOptions());
  };

  const handleAfterLogout = () => {
    let queryParams;
    if (EXTERNAL) {
      if (window?.location?.pathname?.includes('offer')) {
        queryParams = { redirect: window?.location?.pathname };
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
    useGlobalLoader().hide();
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

    if (getLogoutResponse.value && (getLogoutResponse.value.status >= 200) && (getLogoutResponse.value.status <= 300)) {
      cookies.remove('session', cookiesOptions());
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
    if (getSessionData.value?.active && !isGetSessionError.value) {
      usersStore.updateUserAccountSession(getSessionData.value);
      // await notificationsHandler(); // TODO: check if needed
    } else if (!getSessionData.value?.active || getSessionErrorResponse.value?.status === 401) {
      resetAll();
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

    if (setVerificationErrorData.value && setVerificationErrorData.value?.redirect_browser_to
      && (setVerificationErrorData.value?.error?.code === 422)) {
      await getSession();

      const fullUrl = setVerificationErrorData.value.redirect_browser_to;
      navigateWithQueryParams(fullUrl);
      // const newUrl = new URL(fullUrl);
      // const relativePath = newUrl.pathname + newUrl.search;
      // router.replace({ path: relativePath });
    }
  };

  const checkCookie = () => {
    const session = cookies.get('session');
    if (!session) resetAll();
  };

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
    resetAll,
    checkCookie,
    onSocialSignup,
    onSettingsSocial,
    setSettingsTOTP,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthLogicStore, import.meta.hot));
}
