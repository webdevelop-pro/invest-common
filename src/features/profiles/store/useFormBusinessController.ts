import {
  ref, computed, useTemplateRef,
  nextTick,
} from 'vue';
import { storeToRefs } from 'pinia';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/helpers/enums/routes';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRouter } from 'vue-router';
import { FormChild } from 'InvestCommon/types/form';
import env from 'InvestCommon/global';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';

export const useFormBusinessController = () => {
  const router = useRouter();
  const userProfileStore = useProfilesStore();
  const { selectedUserProfileId, selectedUserProfileType, selectedUserProfileData } = storeToRefs(userProfileStore);
  const useRepositoryProfilesStore = useRepositoryProfiles();
  const { setProfileByIdState, getProfileByIdOptionsState } = storeToRefs(useRepositoryProfilesStore);
  const userSessionStore = useSessionStore();
  const { userSessionTraits } = storeToRefs(userSessionStore);

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
      text: 'Business Controller',
    },
  ]);

  const isLoading = ref(false);
  const { submitFormToHubspot } = useHubspotForm(env.HUBSPOT_FORM_ID_BUSINESS_CONTROLLER);

  const businessControllerFormRef = useTemplateRef<FormChild>('businessControllerFormChild');

  const isValid = computed(() => businessControllerFormRef.value?.isValid);
  const isDisabledButton = computed(() => (!isValid.value));
  const modelData = computed(() => selectedUserProfileData?.value?.data);

  const errorData = computed(() => setProfileByIdState.value.error?.data?.responseJson);
  const schemaBackend = computed(() => getProfileByIdOptionsState.value.data);

  const handleSave = async () => {
    businessControllerFormRef.value?.onValidate();
    if (!isValid.value) {
      nextTick(() => scrollToError('ViewDashboardBusinessController'));
      return;
    }

    isLoading.value = true;
    const model = { ...businessControllerFormRef.value?.model };
    try {
      await useRepositoryProfilesStore.setProfileById(
        model,
        selectedUserProfileType.value,
        selectedUserProfileId.value,
      );

      if (!setProfileByIdState.value.error) {
        submitFormToHubspot({
          email: userSessionTraits.value?.email,
          business_controller: businessControllerFormRef.value?.model,
        });
        useRepositoryProfilesStore.getProfileById(selectedUserProfileType.value, selectedUserProfileId.value);
        router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } });
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
    modelData,
    schemaBackend,
    errorData,
  };
};
