import {
  ref, computed, useTemplateRef,
  nextTick,
} from 'vue';
import { storeToRefs } from 'pinia';
import { ROUTE_DASHBOARD_ACCOUNT, ROUTE_ACCREDITATION_UPLOAD } from 'InvestCommon/helpers/enums/routes';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRouter } from 'vue-router';
import { FormChild } from 'InvestCommon/types/form';
import env from 'InvestCommon/global';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryAccreditation } from 'InvestCommon/data/accreditation/accreditation.repository';

export const useFormPersonalInformation = () => {
  const router = useRouter();
  const userProfileStore = useProfilesStore();
  const { selectedUserProfileId, selectedUserProfileType, selectedUserProfileData } = storeToRefs(userProfileStore);
  const useRepositoryProfilesStore = useRepositoryProfiles();
  const { setProfileByIdState, getProfileByIdOptionsState } = storeToRefs(useRepositoryProfilesStore);
  const userSessionStore = useSessionStore();
  const { userSessionTraits } = storeToRefs(userSessionStore);
  const accreditationRepository = useRepositoryAccreditation();

  const backButtonText = ref('Back to Profile Details');
  const backButtonRoute = computed(() => (
    { name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } }));
  const breadcrumbs = computed(() => [
    {
      text: 'Dashboard',
      to: backButtonRoute.value,
    },
    {
      text: 'Profile Details',
      to: backButtonRoute.value,
    },
    {
      text: 'Personal Information',
    },
  ]);

  const isLoading = ref(false);

  const readOnly = computed(() => Boolean(router.currentRoute.value.query.readOnly));
  const isAccreditation = computed(() => router.currentRoute.value.query.accreditation);
  const { submitFormToHubspot } = useHubspotForm(env.HUBSPOT_FORM_ID_PERSONAL_INFORMATION);

  const personalFormRef = useTemplateRef<FormChild>('personalFormChild');

  const isValid = computed(() => personalFormRef.value?.isValid);
  const isDisabledButton = computed(() => (!isValid.value));
  const modelData = computed(() => selectedUserProfileData?.value?.data);

  const errorData = computed(() => setProfileByIdState.value.error?.data?.responseJson);
  const schemaBackend = computed(() => getProfileByIdOptionsState.value.data);

  const handleSave = async () => {
    personalFormRef.value?.onValidate();
    if (!isValid.value) {
      nextTick(() => scrollToError('ViewDashboardPersonalInformation'));
      return;
    }

    isLoading.value = true;
    const model = { ...personalFormRef.value?.model };
    try {
      await useRepositoryProfilesStore.setProfileById(
        model,
        selectedUserProfileType.value,
        selectedUserProfileId.value,
      );

      if (!setProfileByIdState.value.error && selectedUserProfileData.value?.user_id
        && selectedUserProfileData.value?.id && !selectedUserProfileData.value?.escrow_id) {
        try {
          await accreditationRepository.createEscrow(
            selectedUserProfileData.value?.user_id,
            selectedUserProfileData.value?.id,
          );
        } catch (error) {
          console.error('Error creating escrow:', error);
        }
      }
      if (!setProfileByIdState.value.error) {
        submitFormToHubspot({
          email: userSessionTraits.value?.email,
          ...personalFormRef.value?.model,
          date_of_birth: model?.dob,
        });
        useRepositoryProfilesStore.getProfileById(selectedUserProfileType.value, selectedUserProfileId.value);
        if (isAccreditation.value) {
          router.push({ name: ROUTE_ACCREDITATION_UPLOAD, params: { profileId: selectedUserProfileId.value } });
        } else {
          router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } });
        }
      }
    } finally {
      isLoading.value = false;
    }
  };

  return {
    backButtonText,
    backButtonRoute,
    breadcrumbs,
    isDisabledButton,
    isLoading,
    handleSave,
    readOnly,
    isAccreditation,
    modelData,
    schemaBackend,
    errorData,
  };
};
