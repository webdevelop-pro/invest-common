import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { capitalizeFirstLetter } from 'UiKit/helpers/text';
import type { IProfileFormatted } from 'InvestCommon/data/profiles/profiles.types';
import { ROUTE_CREATE_PROFILE, ROUTE_DASHBOARD_SUMMARY } from 'InvestCommon/domain/config/enums/routes';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';

const CREATE_PROFILE_ITEM_ID = 'new';

export type ProfileSwitchMenuItem = {
  id: string;
  label: string;
  statusLabel?: string;
  statusVariant?: 'success' | 'error';
  isActive: boolean;
  isCreateAction?: boolean;
};

const getProfileDisplayId = (profile?: IProfileFormatted | null) => {
  if (!profile?.id) {
    return '';
  }

  const type = profile.type?.slice(0, 2).toUpperCase();
  return `${type}${profile.id}`;
};

const getProfileDisplayName = (profile?: IProfileFormatted | null) => {
  if (!profile) {
    return 'Investment Profile';
  }

  if (profile.type === 'individual') {
    return 'Individual Profile';
  }

  if (profile.type === 'sdira') {
    return profile.data.full_account_name || 'SDIRA Profile';
  }

  const fallbackType = capitalizeFirstLetter(profile.type || 'Investment');
  return profile.data.name || `${fallbackType} Profile`;
};

const getProfileDisplayLabel = (profile?: IProfileFormatted | null) => {
  const profileName = getProfileDisplayName(profile);
  const profileId = getProfileDisplayId(profile);

  return profileId ? `${profileId}: ${profileName}` : profileName;
};

const getProfileEligibility = (profile?: IProfileFormatted | null) => ({
  label: profile?.isKycApproved ? 'Eligible' : 'Not eligible',
  variant: (profile?.isKycApproved ? 'success' : 'error') as 'success' | 'error',
});

export function useProfileSwitchMenu() {
  const router = useRouter();
  const profilesStore = useProfilesStore();
  const { selectedUserProfileId, userProfiles } = storeToRefs(profilesStore);
  const currentProfileId = computed(() => Number(selectedUserProfileId.value));

  const selectedProfile = computed(() => (
    userProfiles.value.find(profile => profile.id === currentProfileId.value) ?? null
  ));

  const selectedProfileLabel = computed(() => getProfileDisplayLabel(selectedProfile.value));

  const profileItems = computed<ProfileSwitchMenuItem[]>(() => {
    const items = userProfiles.value.map((profile) => {
      const eligibility = getProfileEligibility(profile);

      return {
        id: String(profile.id),
        label: getProfileDisplayLabel(profile),
        statusLabel: eligibility.label,
        statusVariant: eligibility.variant,
        isActive: currentProfileId.value === profile.id,
      };
    });

    return [
      ...items,
      {
        id: CREATE_PROFILE_ITEM_ID,
        label: 'Add a new investment profile',
        isActive: false,
        isCreateAction: true,
      },
    ];
  });

  const onSelectProfile = async (id: string) => {
    if (!id) {
      return;
    }

    if (id === CREATE_PROFILE_ITEM_ID) {
      await router.push({ name: ROUTE_CREATE_PROFILE });
      return;
    }

    const nextProfileId = Number(id);
    if (!Number.isFinite(nextProfileId) || currentProfileId.value === nextProfileId) {
      return;
    }

    const currentRoute = router.currentRoute.value;
    if (currentRoute.name) {
      await router.push({
        name: currentRoute.name,
        params: {
          ...currentRoute.params,
          profileId: id,
        },
        query: Object.keys(currentRoute.query).length > 0 ? currentRoute.query : undefined,
      });
    } else {
      await router.push({
        name: ROUTE_DASHBOARD_SUMMARY,
        params: { profileId: nextProfileId },
      });
    }

    profilesStore.setSelectedUserProfileById(nextProfileId);
  };

  return {
    profileItems,
    selectedProfileLabel,
    onSelectProfile,
  };
}
