import { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';

export const redirectProfileIdGuard = async (to: RouteLocationNormalized) => {
  if (!to.meta.checkProfileIdInUrl) return;

  const profilesStore = useProfilesStore();
  const { userProfiles, selectedUserProfileId } = storeToRefs(profilesStore);
  const useRepositoryProfilesStore = useRepositoryProfiles();

  await useRepositoryProfilesStore.getUser();
  const urlProfileId = Number(to.params.profileId);
  const profiles = userProfiles.value;

  // If no profiles, do nothing
  if (!profiles.length) return;

  // If no profileId in URL, redirect to first profile
  if (!urlProfileId) {
    return {
      name: to.name as string,
      params: { ...to.params, profileId: profiles[0].id },
      query: to.query,
    };
  }

  // If profileId in URL does not exist, redirect to first available profile
  const profileExists = profiles.some((profile) => profile.id === urlProfileId);
  if (!profileExists) {
    return {
      name: to.name as string,
      params: { ...to.params, profileId: profiles[0]?.id ?? selectedUserProfileId.value },
      query: to.query,
    };
  }

  // If profileId exists, set it as selected
  profilesStore.setSelectedUserProfileById(urlProfileId);
};

/*
Flow cases:
- if meta.requiresAuth and not logged in user - redirect to signin
*/
