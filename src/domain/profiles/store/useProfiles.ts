import {
  computed, ref, watch,
} from 'vue';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import env from 'InvestCommon/domain/config/env';
import { cookiesOptions } from 'InvestCommon/domain/config/cookies';
import { useCookies } from '@vueuse/integrations/useCookies';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { PROFILE_TYPES } from 'InvestCommon/domain/config/enums/profileTypes';
import { useLogoutStore } from 'InvestCommon/features/auth/store/useLogout';
import { resetAllProfileData } from 'InvestCommon/domain/resetAllData';

const isStaticSite = Number(env.IS_STATIC_SITE ?? 0);

export const useProfilesStore = defineStore('profiles', () => {
  const route = isStaticSite ? null : useRoute();

  const userSessionStore = useSessionStore();
  const { userSession, userLoggedIn } = storeToRefs(userSessionStore);
  const cookies = useCookies();
  const logoutStore = useLogoutStore();

  const useRepositoryProfilesStore = useRepositoryProfiles();
  const {
    getUserState, getProfileByIdState,
  } = storeToRefs(useRepositoryProfilesStore);

  const userProfiles = computed(() => getUserState.value?.data?.profiles || []);
  const selectedUserProfileId = ref(cookies.get('selectedUserProfileId'));
  const profileByIdInProfilesList = computed(() => (
    userProfiles.value.find((item) => item.id === selectedUserProfileId.value)));
  const selectedUserProfileData = computed(() => (
    { ...profileByIdInProfilesList.value, ...getProfileByIdState.value?.data }));
  const selectedUserProfileType = computed(() => (
    userProfiles.value.find((item: { id: number; type: string }) => (
      item.id === Number(selectedUserProfileId.value)))?.type));
  const selectedUserIndividualProfile = computed(() => userProfiles.value.find((profile: { type: string }) => profile.type === 'individual'));

  const isSelectedProfileLoading = computed(() => (
    getProfileByIdState.value?.loading || getUserState.value?.loading || false));

  const urlProfileId = computed(() => {
    if (!isStaticSite) return route?.params?.profileId;
    return (window && window?.location?.pathname.split('/')[3]); // TODO change if url changes
  });

  const isUrlProfileSameAsSelected = computed(() => Number(urlProfileId.value) === selectedUserProfileId.value);

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

  const isTrustRevocable = computed(() => (
    (selectedUserProfileType.value?.toLowerCase() === PROFILE_TYPES.TRUST) && selectedUserProfileData.value?.data?.type?.toLowerCase().includes('revocable')));

  // KYC status checking functions
  const isCurrentProfileKycApproved = computed(() => {
    const currentProfile = profileByIdInProfilesList.value;
    return currentProfile?.isKycApproved;
  });

  const getKycApprovedProfiles = computed(() => {
    return userProfiles.value.filter(profile => profile.isKycApproved);
  });

  const hasAnyKycApprovedProfile = computed(() => {
    return getKycApprovedProfiles.value.length > 0;
  });

  const init = async () => {
    if (!userLoggedIn.value) {
      return;
    }
    if (!getUserState.value?.data && !getUserState.value?.loading) {
      useRepositoryProfilesStore.getUser();
    }
  };
  // if user is logged in and profile is not loaded, load it - step 1
  watch(() => userLoggedIn.value, async () => {
    init();
  }, { immediate: true });

  // if there is error in getUser (profiles) call logout - could happen if session expired
  watch(() => getUserState.value.error, async () => {
    if (getUserState.value.error) {
      logoutStore.logoutHandler();
    }
  }, { immediate: true });

  const setSelectedUserProfileById = (id: number) => {
    
    const newProfileId = Number(id);
    const profileChanged = selectedUserProfileId.value !== newProfileId;
    
    // Only reset all profile-dependent repositories if profile actually changed
    // This prevents unnecessary data clearing when navigating between routes with the same profile
    if (profileChanged) {
      resetAllProfileData();
    }
    
    // Update the selected profile ID
    selectedUserProfileId.value = newProfileId;
    
    if (id === 0) return;
    
    // Save to cookies - use session expires_at when valid, otherwise fallback to 1 year
    const expiresAt = userSession.value?.expires_at;
    const expireDate = expiresAt ? new Date(expiresAt) : null;
    const validExpireDate = (expireDate && !Number.isNaN(expireDate.getTime()))
      ? expireDate
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now

    cookies.set(
      'selectedUserProfileId',
      id,
      cookiesOptions(validExpireDate),
    );
  };

  const updateSelectedAccount = () => {
    const profileType = selectedUserProfileType.value;
    if (!profileType) return;
    useRepositoryProfilesStore.getProfileById(profileType, selectedUserProfileId.value);
  };

  const updateDataInProfile = (nameOfProperty: string, data: unknown) => {
    if (getProfileByIdState.value?.data) {
      (getProfileByIdState.value.data as Record<string, unknown>)[nameOfProperty] = data;
    }
  };

  const updateData = (notification: Notification) => {
    const profile = userProfiles.value.find(
      (item) => item.id === notification.data.fields?.object_id,
    );

    if (profile && notification.data.fields) {
      Object.assign(profile, notification.data.fields);
    }

    const profileData = getProfileByIdState.value?.data;
    if (profileData?.id === notification.data.fields?.object_id) {
      Object.assign(profileData as Record<string, unknown>, notification.data.fields);
    }
  };

  // on init user load if there is no selectedUserProfileId or it is === 0
  // and user profiles loaded and first id is not 0, set selectedUserProfileId - step 2
  watch(() => userProfiles.value[0]?.id, () => {
    if ((!selectedUserProfileId.value || selectedUserProfileId.value === 0) && (userProfiles.value[0]?.id > 0)) {
      setSelectedUserProfileById(userProfiles.value[0]?.id);
    }
  }, { immediate: true });

  watch(() => [selectedUserProfileId.value, selectedUserProfileType.value, isUrlProfileSameAsSelected.value], () => {
    if (userLoggedIn.value && isUrlProfileSameAsSelected.value
      && selectedUserProfileType.value && (selectedUserProfileId.value > 0)) {
      // Clear profile data before fetching to prevent brief flash of old data
      // This ensures the UI shows loading state instead of stale data
      useRepositoryProfilesStore.resetProfileData();
      
      // Fetch new profile data
      useRepositoryProfilesStore.getProfileById(selectedUserProfileType.value, selectedUserProfileId.value);
      useRepositoryProfilesStore.getProfileByIdOptions(selectedUserProfileType.value, selectedUserProfileId.value);
    }
  }, { immediate: true });

  return {
    // State
    userProfiles,
    selectedUserProfileId,
    selectedUserProfileData,
    selectedUserProfileType,
    isSelectedProfileLoading,
    selectedUserIndividualProfile,
    selectedUserProfileShowKycInitForm,
    isTrustRevocable,
    selectedUserProfileRiskAcknowledged,

    // KYC-related computed properties
    isCurrentProfileKycApproved,
    getKycApprovedProfiles,
    hasAnyKycApprovedProfile,

    // Methods
    setSelectedUserProfileById,
    updateSelectedAccount,
    updateDataInProfile,
    updateData,
    init,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProfilesStore, import.meta.hot));
}
