import {
  computed, ref, watch,
} from 'vue';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { useUserProfilesStore } from 'InvestCommon/store/useUserProfiles';
import { useAuthStore } from 'InvestCommon/store/useAuth';
import { useDomainWebSocketStore } from 'InvestCommon/domain/websockets/store/useWebsockets';
import { INotification } from 'InvestCommon/types/api/notifications';
import {
  ROUTE_ACCREDITATION_UPLOAD, ROUTE_DASHBOARD_ACCOUNT, ROUTE_DASHBOARD_BACKGROUND_INFORMATION,
  ROUTE_DASHBOARD_FINANCIAL_AND_INVESTMENT_INFO, ROUTE_DASHBOARD_PERSONAL_DETAILS, ROUTE_DASHBOARD_PORTFOLIO,
  ROUTE_DASHBOARD_TRUSTED_CONTACT, ROUTE_DASHBOARD_WALLET,
  ROUTE_INVESTMENT_DOCUMENTS,
  ROUTE_INVESTMENT_TIMELINE,
  ROUTE_INVEST_AMOUNT, ROUTE_INVEST_FUNDING, ROUTE_INVEST_OWNERSHIP, ROUTE_INVEST_REVIEW,
  ROUTE_INVEST_SIGNATURE, ROUTE_INVEST_THANK, ROUTE_SUBMIT_KYC,
  ROUTE_SETTINGS_ACCOUNT_DETAILS, ROUTE_SETTINGS_MFA, ROUTE_SETTINGS_SECURITY,
} from 'InvestCommon/helpers/enums/routes';
import { useRoute, useRouter } from 'vue-router';
import env, { cookiesOptions } from 'InvestCommon/global/index';
import { PROFILE_TYPES } from 'InvestCommon/global/investment.json';
import { useCookies } from '@vueuse/integrations/useCookies';
import { useUserSession } from './useUserSession';

const { IS_STATIC_SITE } = env;

export const useUsersStore = defineStore('user', () => {
  const router = useRouter();
  const route = useRoute();
  const authStore = useAuthStore();
  const { isGetSessionLoading } = storeToRefs(authStore);
  const userSessionStore = useUserSession();
  const { userSession, userLoggedIn } = storeToRefs(userSessionStore);
  const userProfilesStore = useUserProfilesStore();
  const {
    getUserData, isGetUserLoading,
    getProfileByIdData, getProfileByIdOptionsData,
  } = storeToRefs(userProfilesStore);
  const websocketsStore = useDomainWebSocketStore();
  const cookies = useCookies(['session']);

  // general user data like email that we registered, name,...
  const userAccountSession = computed(() => userSession.value);
  const userAccountData = computed(() => ({
    ...userSession.value?.identity?.traits,
    ...getUserData.value,
  }));
  const userAccountLoading = computed(() => isGetSessionLoading.value);
  // LIST OF USER PROFILES
  const userProfiles = computed(() => getUserData.value?.profiles || []);
  const userProfilesLoading = computed(() => isGetUserLoading.value);
  // SELECTED USER PROFILE
  const selectedUserProfileLoading = computed(() => userProfilesLoading.value);
  const selectedUserProfileId = ref(cookies.get('selectedUserProfileId'));
  // const selectedUserProfileId = useStorage('selectedUserProfileId', 0, sessionStorage);
  // const userProfilesFilteredById = computed(() => (
  //   userProfiles.value.filter((item) => item.id === selectedUserProfileId.value)[0]));
  // const selectedUserProfileData = computed(() => (
  // { ...userProfilesFilteredById.value, ...getUserIndividualProfileData.value }));
  const selectedUserProfileData = computed(() => getProfileByIdData.value);
  const selectedUserProfileType = computed(() => userProfiles.value.find((item) => item.id === selectedUserProfileId.value)?.type || 'individual');
  const selectedUserProfileOptions = computed(() => getProfileByIdOptionsData.value);
  const selectedUserIndividualProfile = computed(() => userProfiles.value.find((profile) => profile.type === 'individual'));

  const updateData = (notification: INotification) => {
    const profile = userProfiles.value.find((item) => item.id === notification.data.fields?.object_id);
    if (profile) {
      if (notification.data.fields?.kyc_status) profile.kyc_status = notification.data.fields.kyc_status;
      if (notification.data.fields?.accreditation_status) {
        profile.accreditation_status = notification.data.fields.accreditation_status;
      }
    }
    if (getProfileByIdData.value) {
      if (notification.data.fields?.kyc_status) {
        getProfileByIdData.value.kyc_status = notification.data.fields.kyc_status;
      }
      if (notification.data.fields?.accreditation_status) {
        getProfileByIdData.value.accreditation_status = notification.data.fields.accreditation_status;
      }
    }
    userProfilesStore.getProfileById(selectedUserProfileType.value, selectedUserProfileId.value);
  };

  const updateDataInProfile = (nameOfProperty: string, data: object | string | number) => {
    getProfileByIdData.value[nameOfProperty] = data;
  };

  const selectedUserProfileRiskAcknowledged = computed(() => {
    const profileData = selectedUserProfileData.value?.data;
    if (profileData?.educational_materials && profileData?.cancelation_restrictions
      && profileData?.resell_difficulties && profileData?.risk_involved
      && profileData?.no_legal_advices_from_company) return true;
    return false;
  });

  const selectedUserProfileAccreditationDataOK = computed(() => {
    const profileData = selectedUserProfileData.value?.data;
    if (!profileData?.accredited_investor) return false;
    return Boolean(profileData?.accredited_investor);
  });

  const selectedUserProfielKYCStatusNotStarted = computed(() => (
    getProfileByIdData.value?.kyc_status === 'new'
  ));

  const selectedUserProfileShowKycInitFormIndividual = computed(() => ((
    !getProfileByIdData.value?.data.citizenship || !selectedUserProfileRiskAcknowledged.value
    || !selectedUserProfileAccreditationDataOK.value || selectedUserProfielKYCStatusNotStarted.value
  ) && (selectedUserProfileType.value === PROFILE_TYPES.INDIVIDUAL)));

  const selectedUserProfileShowKycInitForm = computed(() => (
    selectedUserProfileShowKycInitFormIndividual.value));

  const setSelectedUserProfileById = (id: number) => {
    console.log('selectedUserProfileId', id);
    if (id === 0) return;
    selectedUserProfileId.value = id;
    cookies.set('selectedUserProfileId', id, cookiesOptions((new Date(userSession.value?.expires_at))));
  };

  const updateUserSelectedAccount = () => {
    userProfilesStore.getProfileById(selectedUserProfileType.value, selectedUserProfileId.value);
  };

  // REDIRECT URL AND CHECK PROFILE ID
  const routesToCheckProfileInUrl = [
    ROUTE_SUBMIT_KYC, ROUTE_INVEST_AMOUNT, ROUTE_INVEST_FUNDING, ROUTE_INVEST_OWNERSHIP,
    ROUTE_INVEST_REVIEW, ROUTE_INVEST_SIGNATURE, ROUTE_INVEST_THANK,
    ROUTE_DASHBOARD_ACCOUNT, ROUTE_DASHBOARD_PORTFOLIO, ROUTE_DASHBOARD_WALLET,
    ROUTE_DASHBOARD_BACKGROUND_INFORMATION, ROUTE_DASHBOARD_FINANCIAL_AND_INVESTMENT_INFO,
    ROUTE_DASHBOARD_PERSONAL_DETAILS, ROUTE_DASHBOARD_TRUSTED_CONTACT,
    ROUTE_ACCREDITATION_UPLOAD, ROUTE_INVESTMENT_DOCUMENTS, ROUTE_INVESTMENT_TIMELINE,
    ROUTE_SETTINGS_ACCOUNT_DETAILS, ROUTE_SETTINGS_MFA, ROUTE_SETTINGS_SECURITY,
  ];

  const urlChecked = ref(false);

  const urlProfileId = computed(() => {
    if (!+IS_STATIC_SITE) return route.params?.profileId;
    return (window && window?.location?.pathname.split('/')[2]);
  });

  const resetAll = () => {
    getUserData.value = undefined;
    // selectedUserProfileId.value = null;
    cookies.remove('selectedUserProfileId', cookiesOptions());
    userSessionStore.resetAll();
    urlChecked.value = false;
  };

  const isRouteToCheckProfileInUrl = computed(() => (routesToCheckProfileInUrl.includes(String(route?.name))));
  const isUrlProfileSameAsSelected = computed(() => Number(urlProfileId.value) === selectedUserProfileId.value);
  const isUrlProfileIdInProfiles = computed(() => {
    if (!isRouteToCheckProfileInUrl.value) return true;
    return urlProfileId.value && userProfiles.value?.some((profile) => profile.id === Number(urlProfileId.value));
  });

  watch(() => userLoggedIn.value, async () => {
    if (userLoggedIn.value && !getUserData.value && !isGetUserLoading.value) {
      userProfilesStore.getUser();
      websocketsStore.webSocketHandler();
    }
  }, { immediate: true });

  watch(() => [selectedUserProfileId.value, urlProfileId.value], () => {
    if (userLoggedIn.value && isUrlProfileSameAsSelected.value && selectedUserProfileId.value
      && (selectedUserProfileId.value > 0)) {
      userProfilesStore.getProfileById(selectedUserProfileType.value, selectedUserProfileId.value);
      userProfilesStore.getProfileByIdOptions(selectedUserProfileType.value, selectedUserProfileId.value);
    }
  }, { immediate: true });

  watch(() => userProfiles.value[0]?.id, () => {
    if (userLoggedIn.value
      && (!selectedUserProfileId.value || selectedUserProfileId.value === 0) && (userProfiles.value[0]?.id > 0)) {
      setSelectedUserProfileById(userProfiles.value[0]?.id);
    }
  }, { immediate: true });

  watch(() => [urlProfileId.value, userProfiles.value[0]?.id], () => {
    if (!isUrlProfileIdInProfiles.value && urlProfileId.value && userProfiles.value[0]?.id && (userProfiles.value[0]?.id > 0)) {
      router.push({
        name: router.currentRoute.value.name,
        params: { profileId: selectedUserProfileId.value || userProfiles.value[0]?.id },
        query: { ...router.currentRoute.value.query },
      });
    } else if (!isUrlProfileSameAsSelected.value && urlProfileId.value && isUrlProfileIdInProfiles.value
        && (Number(urlProfileId.value) > 0)) {
      setSelectedUserProfileById(Number(urlProfileId.value));
    }
  }, { immediate: true });

  return {
    resetAll,
    // general user data like email that we registered, name,...
    userAccountData,
    userAccountLoading,
    userLoggedIn,
    // list of user profiles
    userProfiles,
    userProfilesLoading,
    // selected user profile data
    setSelectedUserProfileById,
    selectedUserProfileData,
    selectedUserProfileLoading,
    selectedUserProfileId,
    selectedUserProfileType,
    selectedUserProfileOptions,
    selectedUserIndividualProfile,
    updateUserSelectedAccount,
    userAccountSession,
    selectedUserProfileRiskAcknowledged,
    selectedUserProfileShowKycInitForm,
    selectedUserProfileAccreditationDataOK,
    updateData,
    urlChecked,
    updateDataInProfile,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUsersStore, import.meta.hot));
}
