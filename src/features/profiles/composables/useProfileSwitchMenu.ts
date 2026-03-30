import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { capitalizeFirstLetter } from 'UiKit/helpers/text';
import type { IProfileFormatted } from 'InvestCommon/data/profiles/profiles.types';
import env from 'InvestCommon/config/env';
import { urlCreateProfile } from 'InvestCommon/domain/config/links';
import { ROUTE_CREATE_PROFILE } from 'InvestCommon/domain/config/enums/routes';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { navigateWithQueryParams } from 'UiKit/helpers/general';

const CREATE_PROFILE_ITEM_ID = 'new';
const isStaticSite = Number(env.IS_STATIC_SITE ?? 0) === 1;

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
  const router = isStaticSite ? null : useRouter();
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
      if (isStaticSite) {
        navigateWithQueryParams(urlCreateProfile());
        return;
      }

      await router.push({ name: ROUTE_CREATE_PROFILE });
      return;
    }

    const nextProfileId = Number(id);
    if (!Number.isFinite(nextProfileId) || currentProfileId.value === nextProfileId) {
      return;
    }

    profilesStore.setSelectedUserProfileById(nextProfileId);
  };

  return {
    profileItems,
    selectedProfileLabel,
    onSelectProfile,
  };
}
