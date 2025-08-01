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
  useAuthStore, useFilerStore, useFundingStore, useInvestmentsStore,
  useUserProfilesStore,
} from 'InvestCommon/store';
import env from 'InvestCommon/global/index';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import {
  urlOffers, urlSignin, urlCheckEmail, urlProfile,
} from 'InvestCommon/global/links';
import { useCookies } from '@vueuse/integrations/useCookies';
import { useToast } from 'UiKit/components/Base/VToast/use-toast';
import { oryErrorHandling } from 'UiKit/helpers/api/oryErrorHandling';
import { useDialogs } from 'InvestCommon/domain/dialogs/store/useDialogs';
import { SELFSERVICE } from 'InvestCommon/helpers/enums/auth';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
// import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
// import { useRepositoryNotifications } from 'InvestCommon/data/notifications/notifications.repository';
// import { useRepositoryAccreditation } from 'InvestCommon/data/accreditation/accreditation.repository';

const { IS_STATIC_SITE } = env;

const loading = ref(false);

// This is the store with general flow logic for auth
export const useAuthLogicStore = defineStore('authLogic', () => {
  const router = useRouter();
  const userSessionStore = useSessionStore();
  const cookies = useCookies();
  const { toast } = useToast();
  const useDialogsStore = useDialogs();

  const authStore = useAuthStore();
  const {
    setSignupData, setLoginData, getFlowData, setPasswordData, setRecoveryData,
    setSocialLoginDataError, getLogoutResponse, getLogoutURLData, getSessionData,
    getSessionErrorResponse, isSetLoginError, isGetFlowError, isSetSignupError, isSetPasswordError,
    isSetRecoveryError, isGetLogoutURLError, setVerificationErrorData, setSocialSignupDataError,
    setSettingsErrorData, setPasswordErrorData,
    getSignupData, setLoginErrorData,
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

  const lastSettingsAction = ref();

  // LOGIN
  const onLogin = async (data: object, url: string, query?: Record<string, string>, skipFlowId?: boolean) => {
    loading.value = true;

    if (!skipFlowId) {
      await authStore.fetchAuthHandler(url, query);
      if (isGetFlowError.value) {
        loading.value = false;
        return;
      }
    }

    const body = JSON.stringify({
      csrf_token: csrfToken.value,
      ...data,
    });
    await authStore.setLogin(flowId.value, body);

    if (isSetLoginError.value) {
      oryErrorHandling(setLoginErrorData.value, url);
      loading.value = false;
      return;
    }
    if (query?.refresh) {
      loading.value = false;
      if (lastSettingsAction.value) await lastSettingsAction.value();
      else {
        authStore.fetchAuthHandler(SELFSERVICE.settings);
      }
      return;
    }
    const { submitFormToHubspot } = useHubspotForm('07463465-7f03-42d2-a85e-40cf8e29969d');
    if (setLoginData.value && setLoginData.value.session) {
      if (data?.email) submitFormToHubspot({ email: data?.email });
      const queryRedirect = computed(() => new URLSearchParams(window.location.search).get('redirect'));

      userSessionStore.updateSession(setLoginData.value.session);
      // just set cookies. if use updateUserAccountSession -> get user will be triggered
      // cookies.set(
      //   'session',
      //   setLoginData.value.session,
      //   cookiesOptions(new Date(setLoginData.value.session?.expires_at)),
      // );
      navigateWithQueryParams(queryRedirect.value || urlProfile());
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
      userSessionStore.updateSession(setSignupData.value.session);
      // cookies.set(
      //   'session',
      //   setSignupData.value?.session,
      //   cookiesOptions(new Date(setSignupData.value?.session?.expires_at)),
      // );

      submitFormToHubspot({
        email,
        firstname: firstName,
        lastname: lastName,
      });
      const queryRedirect = computed(() => new URLSearchParams(window.location.search).get('redirect'));
      if (IS_STATIC_SITE) {
        navigateWithQueryParams(queryRedirect.value || urlProfile());
      }
    }

    loading.value = false;
  };

  const refreshRedirect = async (type?: string | undefined) => {
    // const query: Record<string, string> = {
    //   refresh: 'true',
    //   redirect: urlSettings.toString(),
    // };
    // if (type) query.type = type;
    // navigateWithQueryParams(urlSignin, query);
    await useDialogsStore.showRefreshSession(type);
  };

  // RESET
  const onReset = async (password: string, url: string) => {
    lastSettingsAction.value = () => onReset(password, url);
    loading.value = true;
    await authStore.fetchAuthHandler(url);
    if (isGetFlowError.value) {
      loading.value = false;
      return;
    }
    await authStore.setPassword(flowId.value, password, csrfToken.value);

    if (isSetPasswordError.value && setPasswordErrorData.value) oryErrorHandling(setPasswordErrorData.value, url, 'reset');
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
    lastSettingsAction.value = () => onSettingsSocial(url, data);
    await authStore.fetchAuthHandler(url);
    if (isGetFlowError.value) {
      loading.value = false;
      return;
    }
    await authStore.setSettings(flowId.value, data, csrfToken.value);

    if (setSettingsErrorData.value) oryErrorHandling(setSettingsErrorData.value, url, `link:${data.link}` || `unlink:${data.unlink}` || 'social');
    loading.value = false;
  };

  const setSettingsTOTP = async (url: string, data: any) => {
    if (!flowId.value) await authStore.fetchAuthHandler(url);
    if (isGetFlowError.value) {
      loading.value = false;
      return;
    }
    await authStore.setSettings(flowId.value, data, csrfToken.value);

    if (setSettingsErrorData.value) oryErrorHandling(setSettingsErrorData.value, url, 'totp');

    loading.value = false;
    if (!setSettingsErrorData.value) {
      getSession();
      authStore.fetchAuthHandler(url);
    }
  };

  function clearAllCookies() {
    Object.keys(cookies.getAll()).forEach((key) => cookies.remove(key));
  }

  const resetAll = () => {
    useFundingStore().resetAll();
    useUserProfilesStore().resetAll();
    useInvestmentsStore().resetAll();
    useAuthStore().resetAll();
    useFilerStore().resetAll();
    // useRepositoryProfiles().reset();
    // useRepositoryNotifications().reset();
    // useRepositoryAccreditation().reset();
    // cookies.remove('session', cookiesOptions());
    clearAllCookies();
    // useSession().resetAll();
  };

  const handleAfterLogout = () => {
    let queryParams;
    if (IS_STATIC_SITE) {
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
    // useGlobalLoader().hide();
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
      // cookies.remove('session', cookiesOptions());
      useSession().resetAll();
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
    if (getSessionData.value?.active && !getSessionErrorResponse.value) {
      userSessionStore.updateSession(getSessionData.value);
      // usersStore.updateUserAccountSession(getSessionData.value);
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
    csrfToken,
    flowId,
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
    refreshRedirect,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthLogicStore, import.meta.hot));
}
