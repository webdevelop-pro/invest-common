import {
  computed, nextTick, ref, watch,
} from 'vue';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import env, { cookiesOptions } from 'InvestCommon/global/index';
import { useCookies } from '@vueuse/integrations/useCookies';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useDomainWebSocketStore } from 'InvestCommon/domain/websockets/store/useWebsockets';
import { PROFILE_TYPES } from 'InvestCommon/global/investment.json';

const { IS_STATIC_SITE } = env;

export const useProfilesStore = defineStore('profiles', () => {
  const route = useRoute();

  const userSessionStore = useSessionStore();
  const { userSession, userLoggedIn } = storeToRefs(userSessionStore);
  const cookies = useCookies();
  const websocketsStore = useDomainWebSocketStore();

  const useRepositoryProfilesStore = useRepositoryProfiles();
  const {
    getUserState, getProfileByIdState,
  } = storeToRefs(useRepositoryProfilesStore);

  const userProfiles = computed(() => getUserState.value?.data?.profiles || []);
  const selectedUserProfileId = ref(cookies.get('selectedUserProfileId'));
  const profileByIdInProfilesList = computed(() => (
    userProfiles.value.find((item) => item.id === selectedUserProfileId.value)));
  const selectedUserProfileData = computed(() => getProfileByIdState.value?.data || profileByIdInProfilesList.value);
  const selectedUserProfileType = computed(() => userProfiles.value.find((item: { id: number; type: string }) => item.id === selectedUserProfileId.value)?.type);
  const selectedUserIndividualProfile = computed(() => userProfiles.value.find((profile: { type: string }) => profile.type === 'individual'));

  const isSelectedProfileLoading = computed(() => (
    getProfileByIdState.value?.loading || getUserState.value?.loading || false));

  const urlProfileId = computed(() => {
    if (!+IS_STATIC_SITE) return route.params?.profileId;
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
    (selectedUserProfileType.value.toLowerCase() === PROFILE_TYPES.TRUST) && selectedUserProfileData.value?.type?.toLowerCase().includes('revocable')));

  // if user is logged in and profile is not loaded, load it - step 1
  watch(() => userLoggedIn.value, async () => {
    if (!userLoggedIn.value) {
      return;
    }
    if (!getUserState.value?.data && !getUserState.value?.loading) {
      useRepositoryProfilesStore.getUser();
      websocketsStore.webSocketHandler();
    }
  }, { immediate: true });

  const setSelectedUserProfileById = (id: number) => {
    console.log('selectedUserProfileId', id);
    selectedUserProfileId.value = id;
    if (id === 0) return;
    cookies.set('selectedUserProfileId', id, cookiesOptions((new Date(userSession.value?.expires_at))));
  };

  const updateSelectedAccount = () => {
    useRepositoryProfilesStore.getProfileById(selectedUserProfileType.value, selectedUserProfileId.value);
  };

  const updateDataInProfile = (nameOfProperty: string, data: object | string | number) => {
    if (getProfileByIdState.value?.data) {
      getProfileByIdState.value.data[nameOfProperty] = data;
    }
  };

  const updateData = (notification: Notification) => {
    const profile = userProfiles.value.find(
      (item) => item.id === notification.data.fields?.object_id,
    );

    if (profile && notification.data.fields) {
      Object.assign(profile, notification.data.fields);
    }

    if (getProfileByIdState.value?.data?.id === notification.data.fields?.object_id) {
      Object.assign(getProfileByIdState.value.data, notification.data.fields);
    }
  };

  // on init user load if there is no selectedUserProfileId or it is === 0
  // and user profiles loaded and first id is not 0, set selectedUserProfileId - step 2
  watch(() => userProfiles.value[0]?.id, () => {
    if ((!selectedUserProfileId.value || selectedUserProfileId.value === 0) && (userProfiles.value[0]?.id > 0)) {
      setSelectedUserProfileById(userProfiles.value[0]?.id);
    }
  }, { immediate: true });

  watch(() => [selectedUserProfileId.value, urlProfileId.value, selectedUserProfileType.value], () => {
    if (userLoggedIn.value && isUrlProfileSameAsSelected.value && selectedUserProfileId.value
      && selectedUserProfileType.value && (selectedUserProfileId.value > 0)) {
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

    // Methods
    setSelectedUserProfileById,
    updateSelectedAccount,
    updateDataInProfile,
    updateData,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProfilesStore, import.meta.hot));
}
