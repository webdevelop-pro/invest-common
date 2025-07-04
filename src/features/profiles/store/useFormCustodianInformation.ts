import {
  ref, computed, nextTick,
  toRaw, useTemplateRef,
} from 'vue';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/helpers/enums/routes';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRouter } from 'vue-router';
import env from 'InvestCommon/global';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { FormChild } from 'InvestCommon/types/form';

export const useFormCustodianInformation = defineStore('useFormCustodianInformation', () => {
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
      text: 'Custodian Information',
    },
  ]);

  const isLoading = ref(false);

  const custodianRef = useTemplateRef<FormChild>('custodianInformationFormChild');
  const isLoadingFields = computed(() => getProfileByIdOptionsState.value.loading);
  const { submitFormToHubspot } = useHubspotForm(env.HUBSPOT_FORM_ID_CUSTODIAN);

  const errorData = computed(() => setProfileByIdState.value.error);
  const schemaBackend = computed(() => (
    getProfileByIdOptionsState.value.data ? structuredClone(toRaw(getProfileByIdOptionsState.value.data)) : null));

  const isValid = computed(() => custodianRef.value?.isValid);
  const isDisabledButton = computed(() => !isValid.value);
  const modelData = computed(() => selectedUserProfileData?.value?.data);

  const handleSave = async () => {
    custodianRef.value?.onValidate();
    if (!isValid.value) {
      nextTick(() => scrollToError('ViewDashboardCustodianInformation'));
      return;
    }

    isLoading.value = true;
    try {
      await useRepositoryProfilesStore.setProfileById(
        custodianRef.value?.model,
        selectedUserProfileType.value,
        selectedUserProfileId.value,
      );
      if (!setProfileByIdState.value.error) {
        submitFormToHubspot({
          email: userSessionTraits.value?.email,
          ...custodianRef.value?.model,
        });
      }
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
    isLoadingFields,
    handleSave,
    schemaBackend,
    errorData,
    modelData,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFormCustodianInformation, import.meta.hot));
}
