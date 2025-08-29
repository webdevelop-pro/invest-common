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
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';

export const useFormTrustInformation = () => {
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
      text: 'Trust Information',
    },
  ]);

  const isLoading = ref(false);

  const trustInformationFormRef = useTemplateRef<FormChild>('trustInformationFormChild');

  const isValid = computed(() => trustInformationFormRef.value?.isValid);
  const isDisabledButton = computed(() => !isValid.value);
  const modelData = computed(() => selectedUserProfileData?.value?.data);

  const errorData = computed(() => setProfileByIdState.value.error?.data?.responseJson || undefined);
  const schemaBackend = computed(() => getProfileByIdOptionsState.value.data || undefined);

  const handleSave = async () => {
    trustInformationFormRef.value?.onValidate();

    if (!isValid.value) {
      nextTick(() => {
        const element = document.querySelector('.ViewDashboardTrustInformation');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
      return;
    }

    isLoading.value = true;
    try {
      await useRepositoryProfilesStore.setProfileById(
        {
          ...trustInformationFormRef.value?.model,
        },
        selectedUserProfileType.value,
        selectedUserProfileId.value,
      );
      isLoading.value = false;
      useHubspotForm(env.HUBSPOT_FORM_ID_TRUST_INFORMATION).submitFormToHubspot({
        email: userSessionTraits.value?.email,
        ...trustInformationFormRef.value?.model,
      });
      useRepositoryProfilesStore.getProfileById(selectedUserProfileType.value, selectedUserProfileId.value);
      router.push({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: selectedUserProfileId.value } });
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

