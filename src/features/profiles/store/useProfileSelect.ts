import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { capitalizeFirstLetter } from 'UiKit/helpers/text';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { ROUTE_CREATE_PROFILE } from 'InvestCommon/domain/config/enums/routes';
import { InvestKycTypes } from 'InvestCommon/types/api/invest';

interface ISelectedProfile {
  text: string;
  id: number | string;
  kycStatusLabel?: string;
  kycStatusShortLabel?: string;
  kycStatusClass?: string;
  disabled?: boolean;
  disabledMessage?: string;
}

interface IUseProfileSelectOptions {
  hideDisabled?: boolean;
}

export const useProfileSelectStore = (options?: IUseProfileSelectOptions) => {
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

  const getId = (profile: any) => {
    const type = profile.type?.slice(0, 2).toUpperCase();
    return `${type}${profile.id}`;
  };

  const getName = (profile: any) => {
    if (profile.type === 'individual') {
      return capitalizeFirstLetter(profile.type || '');
    }
    if (profile.type === 'sdira') {
      return capitalizeFirstLetter(profile.data.full_account_name || '');
    }
    return capitalizeFirstLetter(profile.data.name || '');
  };

  const getKycStatusLabel = (profile: any) => {
    switch (profile.kyc_status) {
      case InvestKycTypes.approved:
        return 'Eligible';
      case InvestKycTypes.pending:
      case InvestKycTypes.in_progress:
      case InvestKycTypes.declined:
      case InvestKycTypes.new:
      case InvestKycTypes.none:
      default:
        return 'Not eligible';
    }
  };

  const getKycStatusShortLabel = (profile: any) => {
    switch (profile.kyc_status) {
      case InvestKycTypes.approved:
        return 'Eligible';
      case InvestKycTypes.pending:
      case InvestKycTypes.in_progress:
      case InvestKycTypes.declined:
      case InvestKycTypes.new:
      case InvestKycTypes.none:
      default:
        return 'Not eligible';
    }
  };

  const userListFormatted = computed(() => {
    const userProfilesList: ISelectedProfile[] = [];

    userProfiles.value?.forEach((item) => {
      const text = `${getId(item)}: ${getName(item)} Investment Profile`;
      const isDisabled = options?.hideDisabled && !item.isKycApproved;

      userProfilesList.push({
        text: text.charAt(0).toUpperCase() + text.slice(1),
        id: `${item.id}`,
        kycStatusLabel: getKycStatusLabel(item),
        kycStatusShortLabel: getKycStatusShortLabel(item),
        kycStatusClass: item.isKycApproved ? 'is--color-secondary' : 'is--color-red',
        // Do not pass `disabled` to keep v-select-item[data-disabled] unused when using slot.
        disabledMessage: isDisabled ? 'Identity verification is needed.' : undefined,
        disabled: isDisabled,
      });
    });

    userProfilesList.push({
      text: '+ Add A New Investment Profile',
      id: 'new',
    });

    return userProfilesList;
  });

  const onUpdateSelectedProfile = (id: number | string) => {
    if (!id) return;
    if (id === 'new') {
      router.push({ name: ROUTE_CREATE_PROFILE });
    } else {
      userProfilesStore.setSelectedUserProfileById(Number(id));
      
      // Preserve current route queries when updating profile
      const currentRoute = router.currentRoute.value;
      const query = currentRoute.query;
      
      router.push({ 
        name: currentRoute.name, 
        params: { profileId: id },
        query: Object.keys(query).length > 0 ? query : undefined
      });
    }
  };

  return {
    isLoading,
    defaultValue,
    userListFormatted,
    onUpdateSelectedProfile,
  };
};
