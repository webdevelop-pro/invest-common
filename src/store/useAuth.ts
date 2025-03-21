import { ref, toRaw, watch } from 'vue';
import {
  errorHandling422, errorHandlingRecovery, errorHandlingSettings, generalErrorHandling,
} from 'InvestCommon/helpers/generalErrorHandling';
import {
  IGetAuthFlow, IGetLogoutURL, IGetSettingsOk, IRecovery, ISession, ISetLoginOk, ISetSignUpOK,
  IAuthError422, IGetSignup, ISchema, IRecovery422,
} from 'InvestCommon/types/api/auth';
import {
  fetchGetSession, fetchSetLogin, fetchGetLogout, fetchGetLogoutURL,
  fetchSetSignUp, fetchSetRecovery, fetchSetPassword, fetchAuthFlow,
  fetchSetVerification, fetchSetSocialLogin, fetchGetSignUp, fetchGetAllSession, fetchGetSchema,
  fetchSetSocialSignup, fetchGetLogin,
} from 'InvestCommon/services/api/auth';
import { acceptHMRUpdate, defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', () => {
  // FETCH FUNCTIONS
  const isGetSessionLoading = ref(false);
  const isGetSessionError = ref(false);
  const getSessionData = ref<ISession>();
  const getSessionErrorResponse = ref<Response>();
  const getSession = async () => {
    isGetSessionLoading.value = true;
    isGetSessionError.value = false;
    const response = await fetchGetSession().catch((error: Response) => {
      isGetSessionError.value = true;
      getSessionErrorResponse.value = error;
    });
    if (response) getSessionData.value = response;
    isGetSessionLoading.value = false;
  };

  const isGetAllSessionLoading = ref(false);
  const getAllSessionData = ref<unknown>();
  const isGetAllSessionError = ref(false);
  const getAllSession = async () => {
    isGetAllSessionLoading.value = true;
    isGetAllSessionError.value = false;
    const response = await fetchGetAllSession().catch((error: Response) => {
      isGetAllSessionError.value = true;
      void generalErrorHandling(error);
    });
    if (response) getAllSessionData.value = response;
    isGetAllSessionLoading.value = false;
  };

  const isGetSignupLoading = ref(false);
  const isGetSignupError = ref(false);
  const getSignupData = ref<IGetSignup>();
  const getSignup = async (flowId: string) => {
    isGetSignupLoading.value = true;
    isGetSignupError.value = false;
    await fetchGetSignUp(flowId)
      .catch(async (error: Response) => {
        isGetSignupError.value = true;

        const errorJson = await error.json();
        getSignupData.value = errorJson as IGetSignup;
      });
    isGetSignupLoading.value = false;
  };

  const isGetFlowLoading = ref(false);
  const isGetFlowError = ref(false);
  const getFlowData = ref<IGetAuthFlow>();
  const fetchAuthHandler = async (url: string) => {
    getSignupData.value = undefined;
    isGetFlowLoading.value = true;
    isGetFlowError.value = false;
    const response = await fetchAuthFlow(url).catch((error: Response) => {
      isGetFlowError.value = true;
      void generalErrorHandling(error);
    });
    if (response) getFlowData.value = response;
    isGetFlowLoading.value = false;
  };

  const isSetLoginLoading = ref(false);
  const isSetLoginError = ref(false);
  const setLoginData = ref<ISetLoginOk>();
  const setLoginErrorData = ref();
  const setLogin = async (
    flowId: string,
    password: string,
    email: string,
    csrf_token: string,
  ) => {
    isSetLoginLoading.value = true;
    setLoginErrorData.value = undefined;
    isSetLoginError.value = false;
    const response = await fetchSetLogin(flowId, password, email, csrf_token).catch((error: Response) => {
      isSetLoginError.value = true;
      void errorHandling422(error);
    });
    if (response) setLoginData.value = response;
    isSetLoginLoading.value = false;
  };

  const isSetSocialLoginLoading = ref(false);
  const isSetSocialLoginError = ref(false);
  const setSocialLoginData = ref<unknown>();
  const setSocialLoginDataError = ref<IAuthError422>();
  const setSocialLogin = async (
    flowId: string,
    provider: string,
    csrf_token: string,
  ) => {
    isSetSocialLoginLoading.value = true;
    isSetSocialLoginError.value = false;
    const response = await fetchSetSocialLogin(flowId, provider, csrf_token).catch(async (error: Response) => {
      const errorJson = await error.json();
      if (errorJson as IAuthError422) {
        const data:IAuthError422 = errorJson;
        setSocialLoginDataError.value = data;
      } else {
        isSetSocialLoginError.value = true;
        void generalErrorHandling(error);
      }
    });
    if (response) setSocialLoginData.value = response;
    isSetSocialLoginLoading.value = false;
  };

  const isSetSocialSignupLoading = ref(false);
  const isSetSocialSignupError = ref(false);
  const setSocialSignupData = ref<unknown>();
  const setSocialSignupDataError = ref<IAuthError422>();
  const setSocialSignup = async (
    flowId: string,
    provider: string,
    traits: object,
    csrf_token: string,
  ) => {
    isSetSocialSignupLoading.value = true;
    isSetSocialSignupError.value = false;
    const response = await fetchSetSocialSignup(flowId, provider, traits, csrf_token).catch(async (error: Response) => {
      const errorJson = await error.json();
      if (errorJson as IAuthError422) {
        const data:IAuthError422 = errorJson;
        setSocialSignupDataError.value = data;
      } else {
        isSetSocialSignupError.value = true;
        void generalErrorHandling(error);
      }
    });
    if (response) setSocialSignupData.value = response;
    isSetSocialSignupLoading.value = false;
  };

  const isGetLogoutLoading = ref(false);
  const isGetLogoutError = ref(false);
  const getLogoutResponse = ref<Response | void>();
  const getLogout = async (token: string) => {
    isGetLogoutLoading.value = true;
    isGetLogoutError.value = false;
    getLogoutResponse.value = await fetchGetLogout(token)
      .catch((error: Response) => {
        isGetLogoutError.value = true;
        void generalErrorHandling(error);
      });
    isGetLogoutLoading.value = false;
  };

  const isGetLogoutURLLoading = ref(false);
  const isGetLogoutURLError = ref(false);
  const getLogoutURLData = ref<IGetLogoutURL>();
  const getLogoutUrl = async () => {
    isGetLogoutURLLoading.value = true;
    isGetLogoutURLError.value = false;
    const response = await fetchGetLogoutURL().catch((error: Response) => {
      isGetLogoutURLError.value = true;
      void generalErrorHandling(error);
    });
    if (response) getLogoutURLData.value = response;
    isGetLogoutURLLoading.value = false;
  };

  const isGetLoginLoading = ref(false);
  const isGetLoginError = ref(false);
  const getLoginData = ref<IGetSignup>();
  const getLogin = async (flowId: string) => {
    isGetLoginLoading.value = true;
    isGetLoginError.value = false;
    await fetchGetLogin(flowId)
      .catch(async (error: Response) => {
        isGetLoginError.value = true;

        const errorJson = await error.json();
        getLoginData.value = errorJson as IGetSignup;
      });
    isGetLoginLoading.value = false;
  };
  const isSetSignupLoading = ref(false);
  const isSetSignupError = ref(false);
  const setSignupData = ref<ISetSignUpOK>();
  const setSignupErrorData = ref();
  const setSignup = async (
    flowId: string,
    password: string,
    firstName: string,
    lastName: string,
    email: string,
    csrf_token: string,
  ) => {
    isSetSignupLoading.value = true;
    setSignupErrorData.value = undefined;
    isSetSignupError.value = false;
    const response = await fetchSetSignUp(flowId, password, firstName, lastName, email, csrf_token)
      .catch((error: Response) => {
        isSetSignupError.value = true;
        void errorHandling422(error);
      });
    if (response) setSignupData.value = response;
    isSetSignupLoading.value = false;
  };

  const isSetRecoveryLoading = ref(false);
  const isSetRecoveryError = ref(false);
  const setRecoveryData = ref<IRecovery>();
  const setRecoveryErrorData = ref();
  const setRecovery = async (
    flowId: string,
    email: string,
    csrf_token: string,
  ) => {
    isSetRecoveryLoading.value = true;
    isSetRecoveryError.value = false;
    const response = await fetchSetRecovery(flowId, email, csrf_token)
      .catch((error: Response) => {
        isSetRecoveryError.value = true;
        void errorHandlingRecovery(error);
      });
    if (response) setRecoveryData.value = response;
    isSetRecoveryLoading.value = false;
  };

  const isSetVerificationLoading = ref(false);
  const isSetVerificationError = ref(false);
  const setVerificationData = ref<IRecovery422>();
  const setVerificationErrorData = ref();
  // ToDo
  // Should be an interface
  const setVerification = async (
    flowId: string,
    code: string,
    csrf_token: string,
  ) => {
    isSetVerificationLoading.value = true;
    isSetVerificationError.value = false;
    setVerificationErrorData.value = null;
    const response = await fetchSetVerification(flowId, code, csrf_token)
      .catch(async (error: Response) => {
        isSetVerificationError.value = true;
        const errorValue = await errorHandlingRecovery(error);
        setVerificationErrorData.value = structuredClone(toRaw(errorValue));
      });
    if (response) setVerificationData.value = response;
    isSetVerificationLoading.value = false;
  };

  const isSetPasswordLoading = ref(false);
  const isSetPasswordError = ref(false);
  const setPasswordData = ref<IGetSettingsOk>();
  const setPasswordErrorData = ref();
  const setPassword = async (
    flowId: string,
    password: string,
    csrf_token: string,
  ) => {
    isSetPasswordLoading.value = true;
    isSetPasswordError.value = false;
    const response = await fetchSetPassword(flowId, password, csrf_token)
      .catch((error: Response) => {
        isSetPasswordError.value = true;
        void errorHandlingSettings(error);
      });
    if (response) setPasswordData.value = response;
    isSetPasswordLoading.value = false;
  };

  const isGetSchemaLoading = ref(false);
  const isGetSchemaError = ref(false);
  const getSchemaData = ref<ISchema>();
  const getSchemaLoginData = ref<ISchema>();
  const getSchemaSignupData = ref<ISchema>();
  const getSchema = async () => {
    isGetSchemaLoading.value = true;
    isGetSchemaError.value = false;
    const response = await fetchGetSchema()
      .catch((error: Response) => {
        isGetSchemaError.value = true;
        void errorHandlingSettings(error);
      });
    if (response) {
      const responseTraits = response[0].schema.properties.traits;

      delete responseTraits?.properties?.email['ory.sh/kratos'];

      getSchemaData.value = { definitions: { Auth: responseTraits } };
    }
    isGetSchemaLoading.value = false;
  };

  watch(() => getSchemaData.value, () => {
    getSchemaLoginData.value = structuredClone(toRaw(getSchemaData.value));
    getSchemaSignupData.value = structuredClone(toRaw(getSchemaData.value));
  });

  const resetAll = () => {
    getSessionData.value = undefined;
    getFlowData.value = undefined;
    setLoginData.value = undefined;
    getLogoutURLData.value = undefined;
    setSignupData.value = undefined;
    setRecoveryData.value = undefined;
    setVerificationData.value = undefined;
    setPasswordData.value = undefined;
    setSocialLoginData.value = undefined;
    getSignupData.value = undefined;
    getAllSessionData.value = undefined;
    getSessionErrorResponse.value = undefined;
    setLoginErrorData.value = undefined;
    setSignupErrorData.value = undefined;
    setRecoveryErrorData.value = undefined;
    setVerificationErrorData.value = undefined;
    setPasswordErrorData.value = undefined;
    getSchemaLoginData.value = undefined;
    getSchemaSignupData.value = undefined;
  };

  return {
    isGetSessionLoading,
    isSetLoginLoading,
    isGetLogoutLoading,
    isGetLogoutURLLoading,
    isSetSignupLoading,
    isSetRecoveryLoading,
    isSetVerificationLoading,
    isSetPasswordLoading,
    isSetSocialLoginLoading,
    isGetSignupLoading,
    isGetAllSessionLoading,
    isGetFlowLoading,

    isGetSessionError,
    isSetLoginError,
    isGetLogoutError,
    isGetLogoutURLError,
    isSetSignupError,
    isSetVerificationError,
    isSetPasswordError,
    isSetSocialLoginError,
    isGetSignupError,
    setSocialLoginDataError,
    isGetAllSessionError,
    isGetFlowError,
    isSetRecoveryError,

    getSessionData,
    getFlowData,
    setLoginData,
    getLogoutURLData,
    setSignupData,
    setRecoveryData,
    setVerificationData,
    setPasswordData,
    setSocialLoginData,
    getSignupData,
    getAllSessionData,

    getLogoutResponse,
    getSessionErrorResponse,
    setLoginErrorData,
    setSignupErrorData,
    setRecoveryErrorData,
    setVerificationErrorData,
    setPasswordErrorData,

    getSession,
    getAllSession,
    fetchAuthHandler,
    setLogin,
    getLogout,
    getLogoutUrl,
    setSignup,
    setRecovery,
    setVerification,
    setPassword,
    setSocialLogin,
    getSignup,
    resetAll,
    getSchema,
    isGetSchemaLoading,
    isGetSchemaError,
    getSchemaData,
    getSchemaLoginData,
    getSchemaSignupData,
    setSocialSignup,
    isSetSocialSignupLoading,
    isSetSocialSignupError,
    setSocialSignupData,
    setSocialSignupDataError,
    getLogin,
    isGetLoginLoading,
    isGetLoginError,
    getLoginData,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot));
}
