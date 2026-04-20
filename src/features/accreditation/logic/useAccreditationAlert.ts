import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { AccreditationAlerts, AccreditationTypes } from 'InvestCommon/data/accreditation/accreditation.types';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useAccreditationStatus } from '../store/useAccreditationStatus';

export function useAccreditationAlert() {
  const profilesStore = useProfilesStore();
  const { selectedUserProfileData, isSelectedProfileLoading } = storeToRefs(profilesStore);
  const accreditationStore = useAccreditationStatus();
  const { isLoading } = storeToRefs(accreditationStore);

  const isDataLoading = computed(() => (
    isSelectedProfileLoading.value && !selectedUserProfileData.value?.id
  ));

  const accreditationStatus = computed(
    () => selectedUserProfileData.value?.accreditation_status ?? null,
  );

  const shouldShow = computed(() => {
    const profile = selectedUserProfileData.value;
    if (!profile || !accreditationStatus.value) return false;
    return profile.isKycApproved && !profile.isAccreditationApproved;
  });

  const variant = computed<'error' | 'info'>(() => (
    accreditationStatus.value === AccreditationTypes.pending ? 'info' : 'error'
  ));

  const alertData = computed(() => (
    accreditationStatus.value ? AccreditationAlerts[accreditationStatus.value] : null
  ));

  const alertModel = computed(() => ({
    show: shouldShow.value,
    variant: variant.value,
    title: alertData.value?.title,
    description: alertData.value?.description,
    buttonText: alertData.value?.button ? 'Verify Accreditation' : undefined,
    isLoading: isLoading.value,
    isDisabled: false,
  }));

  return {
    alertModel,
    isDataLoading,
    onPrimaryAction: accreditationStore.onClick,
    onDescriptionAction: accreditationStore.onAlertDescriptionClick,
  };
}
