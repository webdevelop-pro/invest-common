import { defineStore, storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { capitalizeFirstLetter } from 'UiKit/helpers/text';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { ROUTE_CREATE_PROFILE } from 'InvestCommon/helpers/enums/routes';

interface ISelectedProfile {
  text: string;
  id: number | string;
}

export const useProfileSelectStore = defineStore('profileSelect', () => {
  const router = useRouter();
  const userProfilesStore = useProfilesStore();
  const { selectedUserProfileId, userProfiles } = storeToRefs(userProfilesStore);

  const isLoading = ref(true);
  const defaultValue = computed(() => String(selectedUserProfileId.value));

  watch(() => selectedUserProfileId.value, () => {
    console.log('selectedUserProfileId changed', selectedUserProfileId.value);
    if (selectedUserProfileId.value > 0) {
      isLoading.value = false;
    }
  }, { immediate: true });

  const getId = (profile) => {
    const type = profile.type?.slice(0, 2).toUpperCase();
    return `${type}${profile.id}`;
  };

  const getName = (profile) => {
    if (profile.type === 'entity') {
      return capitalizeFirstLetter(profile.data?.name || '');
    }
    return capitalizeFirstLetter(profile.type || '');
  };

  const userListFormatted = computed(() => {
    const userProfilesList: ISelectedProfile[] = [];
    userProfiles.value?.forEach((item) => {
      const text = `${getId(item)}: ${getName(item)} Investment Profile`;
      userProfilesList.push({
        text: text.charAt(0).toUpperCase() + text.slice(1),
        id: `${item.id}`,
      });
    });
    userProfilesList.push({
      text: '+ Add A New Investment Account',
      id: 'new',
    });
    return userProfilesList;
  });

  const onUpdateSelectedProfile = (id: number | string) => {
    if (!id) return;
    if (id === 'new') {
      router.push({ name: ROUTE_CREATE_PROFILE });
    } else {
      userProfilesStore.setSelectedUserProfileById(id);
      router.push({ name: router.currentRoute.value.name, params: { profileId: id } });
    }
  };

  return {
    isLoading,
    defaultValue,
    userListFormatted,
    onUpdateSelectedProfile,
  };
});
