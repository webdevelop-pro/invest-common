import { computed, ref, watch } from 'vue';
import { IUserIdentityResponse, IProfile } from 'InvestCommon/types/api/invest';
import { fetchGetUserIdentity } from 'InvestCommon/services';
import { generalErrorHandling } from 'InvestCommon/helpers/generalErrorHandling';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { useAuthStore, useCore, useUserIdentitysStore } from 'InvestCommon/store';
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


export const useUsersStore = defineStore('user', () => {
  const { person } = useCore();
  const router = useRouter();
  const route = useRoute();
  const authStore = useAuthStore();
  const { isGetSessionLoading } = storeToRefs(authStore);
  const userIdentitysStore = useUserIdentitysStore();
  const { getUserIndividualProfileData, setUserIdentityOptionsData } = storeToRefs(userIdentitysStore);

  const switchUserProfile = (profiles: IProfile[], id: number) => {
    if (!profiles) return;
    const p = profiles.find((profile) => profile.id === id) || profiles[0];
    if (!p) return;
    person.value.setUserData({
      ...p.data,
      profile_id: p.id,
      profile_type: p.type,
      user_id: p.user_id,
      escrow_id: p.escrow_id,
      kyc_status: p.kyc_status,
      kyc_data: p.kyc_data,
      accreditation_status: p.accreditation_status,
      accreditation_data: p.accreditation_data,
      total_distributions: p.total_distributions,
      total_investments: p.total_investments,
      total_investments_12_months: p.total_investments_12_months,
      wallet_id: p.wallet_id,
    });
  };

  const isGetUserIdentityLoading = ref(false);
  const isGetUserIdentityError = ref(false);
  const getUserIdentityData = ref<IUserIdentityResponse>();
  const getUserIdentity = async () => {
    isGetUserIdentityLoading.value = true;
    isGetUserIdentityError.value = false;
    const response = await fetchGetUserIdentity().catch((error: Response) => {
      isGetUserIdentityError.value = true;
      void generalErrorHandling(error);
    });
    if (response) {
      getUserIdentityData.value = response;
      switchUserProfile(getUserIdentityData.value.profiles, getUserIdentityData.value.id);
      // person.value.setUserData({ ...getUserIdentityData.value.data });
    }
    isGetUserIdentityLoading.value = false;
  };

  // general user data like email that we registered, name,...
  const userAccountSession = ref<ISession>();
  const updateUserAccountSession = (session: ISession) => {
    userAccountSession.value = session;
  };
  const userLoggedIn = useStorage('loggedIn', false);
  const userAccountData = computed(() => userAccountSession.value?.identity.traits);
  const userAccountLoading = computed(() => isGetSessionLoading.value);
  // LIST OF USER PROFILES
  const userProfiles = computed(() => getUserIdentityData.value?.profiles || []);
  const userProfilesLoading = computed(() => isGetUserIdentityLoading.value);
  // SELECTED USER PROFILE
  const selectedUserProfileLoading = computed(() => userProfilesLoading.value);
  const localSelectedUserProfileId = ref(userProfiles.value[0]?.id || 0);
  const selectedUserProfileId = useStorage('selectedUserProfileId', localSelectedUserProfileId);
  // const userProfilesFilteredById = computed(() => (
  //   userProfiles.value.filter((item) => item.id === selectedUserProfileId.value)[0]));
  // const selectedUserProfileData = computed(() => (
  // { ...userProfilesFilteredById.value, ...getUserIndividualProfileData.value }));
  const selectedUserProfileData = computed(() => getUserIndividualProfileData.value);
  const selectedUserProfileOptions = computed(() => setUserIdentityOptionsData.value);

  const updateData = (notification: INotification) => {
    const profile = userProfiles.value.find((item) => item.id === notification.data.fields?.object_id);
    if (profile) {
      if (notification.data.fields?.kyc_status) profile.kyc_status = notification.data.fields.kyc_status;
      if (notification.data.fields?.accreditation_status) {
        profile.accreditation_status = notification.data.fields.accreditation_status;
      }
    }
    if (getUserIndividualProfileData.value) {
      if (notification.data.fields?.kyc_status) {
        getUserIndividualProfileData.value.kyc_status = notification.data.fields.kyc_status;
      }
      if (notification.data.fields?.accreditation_status) {
        getUserIndividualProfileData.value.accreditation_status = notification.data.fields.accreditation_status;
      }
    }
    void userIdentitysStore.getUserIndividualProfile();
  };

  const updateDataInProfile = (nameOfProperty: string, data: object | string | number) => {
    getUserIndividualProfileData.value[nameOfProperty] = data;
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

  const selectedUserProfileShowKycInitForm = computed(() => (
    !getUserIndividualProfileData.value?.data.citizenship || !selectedUserProfileRiskAcknowledged.value
    || !selectedUserProfileAccreditationDataOK.value
  ));

  const setSelectedUserProfileById = (id: number) => {
    localSelectedUserProfileId.value = id;
  };

  const updateUserSelectedAccount = async () => {
    await userIdentitysStore.getUserIndividualProfile();
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

  watch(() => selectedUserProfileId.value, () => {
    // load proper data by id on id change
    if (selectedUserProfileId.value && selectedUserProfileId.value > 0) {
      if (!getUserIndividualProfileData.value) void userIdentitysStore.getUserIndividualProfile();
      if (!setUserIdentityOptionsData.value) void userIdentitysStore.setUserIdentityOptions();
    }
  }, { immediate: true });

  watch(() => userAccountSession.value?.active, () => {
    if (!userAccountSession.value?.active) {
      userLoggedIn.value = null;
    } else {
      userLoggedIn.value = userAccountSession.value?.active;
      void getUserIdentity();
    }
  }, { immediate: true });

  watch(() => userProfiles.value[0]?.id, () => {
    setSelectedUserProfileById(userProfiles.value[0]?.id);
  }, { immediate: true });


  watch(() => [userProfiles.value, route.params.profileId], () => {
    if (!urlChecked.value && userLoggedIn.value
      && route.params.profileId && (userProfiles.value?.length > 0)) checkInitUrl(route);
  }, { immediate: true, deep: true });

  const resetAll = () => {
    getUserIdentityData.value = undefined;
    selectedUserProfileId.value = null;
    localSelectedUserProfileId.value = 0;
    userAccountSession.value = undefined;
    urlChecked.value = false;
    userLoggedIn.value = null;
  };

  return {
    resetAll,
    getUserIdentity,
    isGetUserIdentityLoading,
    isGetUserIdentityError,
    getUserIdentityData,
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
    selectedUserProfileOptions,
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
