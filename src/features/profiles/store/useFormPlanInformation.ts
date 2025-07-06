import {
  ref, computed, useTemplateRef,
  nextTick,
} from 'vue';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/helpers/enums/routes';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRouter } from 'vue-router';
import { FormChild } from 'InvestCommon/types/form';
import env from 'InvestCommon/global';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';

export const useFormPlanInformation = defineStore('useFormPlanInformation', () => {
  const router = useRouter();
  const userProfileStore = useProfilesStore();
  const { selectedUserProfileId, selectedUserProfileType, selectedUserProfileData } = storeToRefs(userProfileStore);
  const useRepositoryProfilesStore = useRepositoryProfiles();
  const { setProfileByIdState, getProfileByIdOptionsState } = storeToRefs(useRepositoryProfilesStore);
  const userSessionStore = useSessionStore();
  const { userSessionTraits } = storeToRefs(userSessionStore);

  const backButtonText = ref('Back to Profile Details');
  const accountRoute = computed(() => (
    { name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } }));
  const breadcrumbs = computed(() => [
    {
      text: 'Dashboard',
      to: accountRoute.value,
    },
    {
      text: 'Profile Details',
      to: accountRoute.value,
    },
    {
      text: 'Plan Information',
    },
  ]);

  const isLoading = ref(false);

  const planInformationFormRef = useTemplateRef<FormChild>('planInformationFormChild');

  const isValid = computed(() => planInformationFormRef.value?.isValid);
  const isDisabledButton = computed(() => !isValid.value);
  const modelData = computed(() => selectedUserProfileData?.value?.data);

  const errorData = computed(() => setProfileByIdState.value.error);
  const schemaBackend = computed(() => getProfileByIdOptionsState.value.data);

  const handleSave = async () => {
    planInformationFormRef.value?.onValidate();

    if (!isValid.value) {
      nextTick(() => scrollToError('ViewDashboardPlanInformation'));
      return;
    }

    isLoading.value = true;
    try {
      await useRepositoryProfilesStore.setProfileById(
        {
          ...planInformationFormRef.value?.model,
        },
        selectedUserProfileType.value,
        selectedUserProfileId.value,
      );
      isLoading.value = false;
      useHubspotForm(env.HUBSPOT_FORM_ID_PLAN_INFO).submitFormToHubspot({
        email: userSessionTraits.value?.email,
        ...planInformationFormRef.value?.model,
      });
      useRepositoryProfilesStore.getProfileById(selectedUserProfileType.value, selectedUserProfileId.value);
      router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } });
    } finally {
      isLoading.value = false;
    }
  };

  return {
    backButtonText,
    breadcrumbs,
    isDisabledButton,
    isLoading,
    handleSave,
    modelData,
    schemaBackend,
    errorData,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFormPlanInformation, import.meta.hot));
}
