import { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';

export const redirectProfileIdGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
// eslint-disable-next-line consistent-return
) => {
  if (!to.meta.checkProfileIdInUrl) {
    return next();
  }

  const profilesStore = useProfilesStore();
  const { userProfiles, selectedUserProfileId } = storeToRefs(profilesStore);
  const useRepositoryProfilesStore = useRepositoryProfiles();

  await useRepositoryProfilesStore.getUser();
  const urlProfileId = Number(to.params.profileId);

  // If no profile ID in URL, redirect to first profile
  if (!urlProfileId && userProfiles.value.length > 0) {
    return next({
      name: to.name as string,
      params: { ...to.params, profileId: userProfiles.value[0].id },
      query: to.query,
    });
  }

  // Check if profile ID exists in user's profiles
  const profileExists = userProfiles.value.some((profile) => profile.id === urlProfileId);

  if (!profileExists) {
    // If profile doesn't exist, redirect to first available profile
    return next({
      name: to.name as string,
      params: { ...to.params, profileId: userProfiles.value[0]?.id || selectedUserProfileId.value },
      query: to.query,
    });
  }

  // Set the selected profile ID if it exists in URL
  if (profileExists) {
    profilesStore.setSelectedUserProfileById(urlProfileId);
  }

  next();
};

/*
Flow cases:
- if meta.requiresAuth and not logged in user - redirect to signin
*/
