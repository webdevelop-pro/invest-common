import {
  computed, ref, watch,
} from 'vue';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import env, { cookiesOptions } from 'InvestCommon/global/index';
import { useCookies } from '@vueuse/integrations/useCookies';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';

const { IS_STATIC_SITE } = env;

export const useProfilesStore = defineStore('profiles', () => {
  const route = useRoute();

  const userSessionStore = useSessionStore();
  const { userSession, userLoggedIn } = storeToRefs(userSessionStore);
  const cookies = useCookies();

  const useRepositoryProfilesStore = useRepositoryProfiles();
  const {
    getUserState, getProfileByIdState,
  } = storeToRefs(useRepositoryProfilesStore);

  const userProfiles = computed(() => getUserState.value?.data?.profiles || []);
  const selectedUserProfileId = ref(0);
  const profileByIdInProfilesList = computed(() => userProfiles.value.find((item) => item.id === selectedUserProfileId.value));
  const selectedUserProfileData = computed(() => getProfileByIdState.value?.data || profileByIdInProfilesList.value);
  const selectedUserProfileType = computed(() => selectedUserProfileData.value?.type || 'individual');

  const urlProfileId = computed(() => {
    if (!+IS_STATIC_SITE) return route.params?.profileId;
    return (window && window?.location?.pathname.split('/')[2]);
  });

  const isUrlProfileSameAsSelected = computed(() => Number(urlProfileId.value) === selectedUserProfileId.value);

  // if user is logged in and profile is not loaded, load it - step 1
  watch(() => userLoggedIn.value, async () => {
    if (!userLoggedIn.value) {
      return;
    }
    if (!getUserState.value?.data && !getUserState.value?.loading) {
      useRepositoryProfilesStore.getUser();
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
    if (!userLoggedIn.value) {
      return;
    }
    if ((!selectedUserProfileId.value || selectedUserProfileId.value === 0) && (userProfiles.value[0]?.id > 0)) {
      setSelectedUserProfileById(userProfiles.value[0]?.id);
    }
  }, { immediate: true });

  watch(() => [selectedUserProfileId.value, urlProfileId.value], () => {
    if (userLoggedIn.value && isUrlProfileSameAsSelected.value && selectedUserProfileId.value
      && (selectedUserProfileId.value > 0)) {
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
