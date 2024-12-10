import {
  computed, nextTick, ref, watch,
} from 'vue';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { useUserProfilesStore } from 'InvestCommon/store/useUserProfiles';
import { useAuthStore } from 'InvestCommon/store/useAuth';
import { useNotificationsStore } from 'InvestCommon/store/useNotifications';
import { useStorage } from '@vueuse/core';
import { ISession } from 'InvestCommon/types/api/auth';
import { INotification } from 'InvestCommon/types/api/notifications';
import {
  ROUTE_ACCREDITATION_UPLOAD, ROUTE_DASHBOARD_ACCOUNT, ROUTE_DASHBOARD_BACKGROUND_INFORMATION,
  ROUTE_DASHBOARD_FINANCIAL_AND_INVESTMENT_INFO, ROUTE_DASHBOARD_PERSONAL_DETAILS, ROUTE_DASHBOARD_PORTFOLIO,
  ROUTE_DASHBOARD_TRUSTED_CONTACT, ROUTE_DASHBOARD_WALLET,
  ROUTE_INVESTMENT_DOCUMENTS,
  ROUTE_INVESTMENT_TIMELINE,
  ROUTE_INVEST_AMOUNT, ROUTE_INVEST_FUNDING, ROUTE_INVEST_OWNERSHIP, ROUTE_INVEST_REVIEW,
  ROUTE_INVEST_SIGNATURE, ROUTE_INVEST_THANK, ROUTE_SUBMIT_KYC,
} from 'InvestCommon/helpers/enums/routes';
import { RouteLocationNormalized, useRoute, useRouter } from 'vue-router';
import env from 'InvestCommon/global/index';
import { PROFILE_TYPES } from 'InvestCommon/global/investment.json';

const { EXTERNAL } = env;


export const useUsersStore = defineStore('user', () => {
  const router = useRouter();
  const route = useRoute();
  const authStore = useAuthStore();
  const { isGetSessionLoading } = storeToRefs(authStore);
  const userProfilesStore = useUserProfilesStore();
  const {
    getUserData, isGetUserLoading,
    getProfileByIdData, getProfileByIdOptionsData,
  } = storeToRefs(userProfilesStore);
  const notificationsStore = useNotificationsStore();

  // general user data like email that we registered, name,...
  const userAccountSession = ref<ISession>();
  const updateUserAccountSession = (session: ISession) => {
    userAccountSession.value = session;
  };
  const userLoggedIn = useStorage('loggedIn', false);
  const userAccountData = computed(() => userAccountSession.value?.identity.traits);
  const userAccountLoading = computed(() => isGetSessionLoading.value);
  // LIST OF USER PROFILES
  const userProfiles = computed(() => getUserData.value?.profiles || []);
  const userProfilesLoading = computed(() => isGetUserLoading.value);
  // SELECTED USER PROFILE
  const selectedUserProfileLoading = computed(() => userProfilesLoading.value);
  const selectedUserProfileId = useStorage('selectedUserProfileId', 0);
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
    void userProfilesStore.getProfileById(selectedUserProfileType.value, selectedUserProfileId.value);
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
    selectedUserProfileId.value = id;
  };

  const updateUserSelectedAccount = () => {
    void userProfilesStore.getProfileById(selectedUserProfileType.value, selectedUserProfileId.value);
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

  // check on url refresh
  const checkInitUrl = (to: RouteLocationNormalized) => {
    if (urlChecked.value) return;
    const isRouteToCheckProfileInUrl = computed(() => (
      routesToCheckProfileInUrl.includes(String(to.name))));
    const urlProfileID = computed(() => Number(to.params.profileId));
    const profilesIds = computed(() => (userProfiles.value.map((profile) => profile.id)));
    const isHaveProfileID = computed(() => (profilesIds.value.includes(urlProfileID.value)));
    // if route to check profile AND url profile id is NOT in profile list then redirect to DASHBOARD
    // and set selected profile id and first in profile list
    if (isRouteToCheckProfileInUrl.value && !isHaveProfileID.value) {
      urlChecked.value = true;
      // setSelectedUserProfileById(userProfiles.value[0]?.id);
      void router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } });
    }
    // if route to check profile AND url profile id IS in profile list then url load
    // and set selected profile id from url
    if (isRouteToCheckProfileInUrl.value && isHaveProfileID.value) {
      urlChecked.value = true;
      setSelectedUserProfileById(urlProfileID.value);
    }
  };
  // END REDIRECT URL AND CHECK PROFILE ID


  watch(() => userAccountSession.value?.active, async () => {
    if (userAccountSession.value?.active) {
      if (!getUserData.value) await userProfilesStore.getUser();
      userLoggedIn.value = userAccountSession.value?.active;
      void nextTick(() => {
        void notificationsStore.notificationsHandler();
        void userProfilesStore.getProfileById(selectedUserProfileType.value, selectedUserProfileId.value);
        void userProfilesStore.getProfileByIdOptions(selectedUserProfileType.value, selectedUserProfileId.value);
      });
    }
  });

  watch(() => userProfiles.value[0]?.id, () => {
    if (!selectedUserProfileId.value || selectedUserProfileId.value === 0) {
      setSelectedUserProfileById(userProfiles.value[0]?.id);
    }
  }, { immediate: true });

  const urlProfileId = computed(() => {
    if (!EXTERNAL) return route.params.profileId;
    return (window && window?.location?.pathname.split('/')[2]);
  });

  watch(() => [userProfiles.value, urlProfileId.value], () => {
    if (!urlChecked.value && userLoggedIn.value
      && urlProfileId.value && (userProfiles.value?.length > 0) && !EXTERNAL) checkInitUrl(route);
    if (userLoggedIn.value && urlProfileId.value && !EXTERNAL) {
      setSelectedUserProfileById(Number(urlProfileId.value));
      void userProfilesStore.getProfileById(selectedUserProfileType.value, Number(urlProfileId.value));
      void router.push({ name: router.currentRoute.value.name, params: { profileId: urlProfileId.value } });
      void userProfilesStore.getProfileByIdOptions(selectedUserProfileType.value, selectedUserProfileId.value);
    }
  }, { immediate: true, deep: true });

  const resetAll = () => {
    getUserData.value = undefined;
    selectedUserProfileId.value = null;
    userAccountSession.value = undefined;
    urlChecked.value = false;
    userLoggedIn.value = null;
  };

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
    updateUserAccountSession,
    updateUserSelectedAccount,
    userAccountSession,
    selectedUserProfileRiskAcknowledged,
    selectedUserProfileShowKycInitForm,
    selectedUserProfileAccreditationDataOK,
    updateData,
    checkInitUrl,
    urlChecked,
    updateDataInProfile,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUsersStore, import.meta.hot));
}
