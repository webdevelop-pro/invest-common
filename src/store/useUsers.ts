import {
  computed, ref, watch,
} from 'vue';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { useAuthStore } from 'InvestCommon/store/useAuth';
import { useDomainWebSocketStore } from 'InvestCommon/domain/websockets/store/useWebsockets';
import { INotification } from 'InvestCommon/data/notifications/notifications.types';
import {
  ROUTE_ACCREDITATION_UPLOAD, ROUTE_DASHBOARD_ACCOUNT, ROUTE_DASHBOARD_BACKGROUND_INFORMATION,
  ROUTE_DASHBOARD_FINANCIAL_AND_INVESTMENT_INFO, ROUTE_DASHBOARD_PERSONAL_DETAILS, ROUTE_DASHBOARD_PORTFOLIO,
  ROUTE_DASHBOARD_TRUSTED_CONTACT, ROUTE_DASHBOARD_WALLET,
  ROUTE_INVESTMENT_DOCUMENTS,
  ROUTE_INVESTMENT_TIMELINE,
  ROUTE_INVEST_AMOUNT, ROUTE_INVEST_FUNDING, ROUTE_INVEST_OWNERSHIP, ROUTE_INVEST_REVIEW,
  ROUTE_INVEST_SIGNATURE, ROUTE_INVEST_THANK, ROUTE_SUBMIT_KYC,
} from 'InvestCommon/helpers/enums/routes';
import { useRoute, useRouter } from 'vue-router';
import env, { cookiesOptions } from 'InvestCommon/global/index';
import { PROFILE_TYPES } from 'InvestCommon/global/investment.json';
import { useCookies } from '@vueuse/integrations/useCookies';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';

const { IS_STATIC_SITE } = env;

export const useUsersStore = defineStore('user', () => {
  const router = useRouter();
  const route = useRoute();
  const authStore = useAuthStore();
  const { isGetSessionLoading } = storeToRefs(authStore);
  const userSessionStore = useSessionStore();
  const { userSession, userLoggedIn } = storeToRefs(userSessionStore);
  const useRepositoryProfilesStore = useRepositoryProfiles();
  const {
    getUserState,
    getProfileByIdState, getProfileByIdOptionsState,
  } = storeToRefs(useRepositoryProfilesStore);
  // console.log('getUserState.value', getUserState.value.value);
  const websocketsStore = useDomainWebSocketStore();
  const cookies = useCookies(['session']);

  // general user data like email that we registered, name,...
  const userAccountSession = computed(() => userSession.value);
  const userAccountData = computed(() => ({
    ...userSession.value?.identity?.traits,
    ...getUserState.value?.data,
  }));
  const userAccountLoading = computed(() => isGetSessionLoading.value);
  // LIST OF USER PROFILES
  const userProfiles = computed(() => getUserState.value?.data?.profiles || []);
  const userProfilesLoading = computed(() => getUserState.value?.loading);
  // SELECTED USER PROFILE
  const selectedUserProfileLoading = computed(() => userProfilesLoading.value);
  const selectedUserProfileId = ref(0);
  // const selectedUserProfileId = useStorage('selectedUserProfileId', 0, sessionStorage);
  // const userProfilesFilteredById = computed(() => (
  //   userProfiles.value.filter((item) => item.id === selectedUserProfileId.value)[0]));
  // const selectedUserProfileData = computed(() => (
  // { ...userProfilesFilteredById.value, ...getUserIndividualProfileData.value }));
  const selectedUserProfileData = computed(() => getProfileByIdState.value?.data);
  const selectedUserProfileType = computed(() => userProfiles.value.find((item: { id: number; type: string }) => item.id === selectedUserProfileId.value)?.type || 'individual');
  const selectedUserProfileOptions = computed(() => getProfileByIdOptionsState.value?.data);
  const selectedUserIndividualProfile = computed(() => userProfiles.value.find((profile: { type: string }) => profile.type === 'individual'));

  const updateData = (notification: INotification) => {
    const profile = userProfiles.value.find((item: { id: number }) => item.id === notification.data.fields?.object_id);
    if (profile) {
      if (notification.data.fields?.kyc_status) profile.kyc_status = notification.data.fields.kyc_status;
      if (notification.data.fields?.accreditation_status) {
        profile.accreditation_status = notification.data.fields.accreditation_status;
      }
    }
    if (getProfileByIdState.value?.data) {
      if (notification.data.fields?.kyc_status) {
        getProfileByIdState.value.data.kyc_status = notification.data.fields.kyc_status;
      }
      if (notification.data.fields?.accreditation_status) {
        getProfileByIdState.value.data.accreditation_status = notification.data.fields.accreditation_status;
      }
    }
    useRepositoryProfilesStore.getProfileById(selectedUserProfileType.value, selectedUserProfileId.value);
  };

  const updateDataInProfile = (nameOfProperty: string, data: object | string | number) => {
    getProfileByIdState.value.data[nameOfProperty] = data;
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
    getProfileByIdState.value.data?.kyc_status === 'new'
  ));

  const selectedUserProfileShowKycInitFormIndividual = computed(() => ((
    !getProfileByIdState.value.data?.data.citizenship || !selectedUserProfileRiskAcknowledged.value
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
    useRepositoryProfilesStore.getProfileById(selectedUserProfileType.value, selectedUserProfileId.value);
  };

  // REDIRECT URL AND CHECK PROFILE ID
  const routesToCheckProfileInUrl = [
    ROUTE_SUBMIT_KYC, ROUTE_INVEST_AMOUNT, ROUTE_INVEST_FUNDING, ROUTE_INVEST_OWNERSHIP,
    ROUTE_INVEST_REVIEW, ROUTE_INVEST_SIGNATURE, ROUTE_INVEST_THANK,
    ROUTE_DASHBOARD_ACCOUNT, ROUTE_DASHBOARD_PORTFOLIO, ROUTE_DASHBOARD_WALLET,
    ROUTE_DASHBOARD_BACKGROUND_INFORMATION, ROUTE_DASHBOARD_FINANCIAL_AND_INVESTMENT_INFO,
    ROUTE_DASHBOARD_PERSONAL_DETAILS, ROUTE_DASHBOARD_TRUSTED_CONTACT,
    ROUTE_ACCREDITATION_UPLOAD, ROUTE_INVESTMENT_DOCUMENTS, ROUTE_INVESTMENT_TIMELINE,
  ];

  const urlChecked = ref(false);

  const urlProfileId = computed(() => {
    if (!+IS_STATIC_SITE) return route.params?.profileId;
    return (window && window?.location?.pathname.split('/')[2]);
  });

  const resetAll = () => {
    // getUserState.value.data.value = undefined;
    // selectedUserProfileId.value = null;
    cookies.remove('selectedUserProfileId', cookiesOptions());
    userSessionStore.resetAll();
    urlChecked.value = false;
  };

  const isRouteToCheckProfileInUrl = computed(() => (routesToCheckProfileInUrl.includes(String(route?.name))));
  const isUrlProfileSameAsSelected = computed(() => Number(urlProfileId.value) === selectedUserProfileId.value);
  const isUrlProfileIdInProfiles = computed(() => {
    if (!isRouteToCheckProfileInUrl.value) return true;
    return urlProfileId.value && userProfiles.value?.some((profile: { id: number }) => profile.id === Number(urlProfileId.value));
  });

  watch(() => userLoggedIn.value, async () => {
    if (userLoggedIn.value && !getUserState.value?.data && !getUserState.value?.loading) {
      useRepositoryProfilesStore.getUser();
      websocketsStore.webSocketHandler();
    }
  }, { immediate: true });

  watch(() => [selectedUserProfileId.value, urlProfileId.value], () => {
    if (userLoggedIn.value && isUrlProfileSameAsSelected.value && selectedUserProfileId.value
      && (selectedUserProfileId.value > 0)) {
      useRepositoryProfilesStore.getProfileById(selectedUserProfileType.value, selectedUserProfileId.value);
      useRepositoryProfilesStore.getProfileByIdOptions(selectedUserProfileType.value, selectedUserProfileId.value);
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
