import { ref, computed, useTemplateRef, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useHubspotForm } from 'UiKit/composables/useHubspotForm';
import { useToast } from 'UiKit/components/Base/VToast/use-toast';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { storeToRefs } from 'pinia';
import { ROUTE_SETTINGS_MFA } from 'InvestCommon/domain/config/enums/routes';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { FormChild } from 'InvestCommon/types/form';
import { useRepositoryFiler } from 'InvestCommon/data/filer/filer.repository';
import env from 'InvestCommon/domain/config/env';

export function useSettingsAccountDetails() {
  const globalLoader = useGlobalLoader();
  globalLoader.hide();

  const userProfileStore = useProfilesStore();
  const { selectedUserProfileId } = storeToRefs(userProfileStore);
  const useRepositoryProfilesStore = useRepositoryProfiles();
  const { getUserState, setUserState } = storeToRefs(useRepositoryProfilesStore);
  const filerRepository = useRepositoryFiler();
  const { notificationFieldsState } = storeToRefs(filerRepository);

  const router = useRouter();
  const userSessionStore = useSessionStore();
  const { userSessionTraits } = storeToRefs(userSessionStore);

  const { toast } = useToast();
  const TOAST_OPTIONS = { title: 'Submitted!', variant: 'success' as const };

  const personalFormRef = useTemplateRef<FormChild>('personalFormChild');

  const { submitFormToHubspot } = useHubspotForm(env.HUBSPOT_FORM_ID_ACCOUNT);

  const isLoading = ref(false);
  const isValid = computed(() => (personalFormRef.value?.isValid));
  const isDisabledButton = computed(() => (!isValid.value || setUserState.value.loading));
  const userData = computed(() => ({...userSessionTraits.value, ...getUserState.value.data }));

  const breadcrumbs = computed(() => [
    {
      text: 'Account Settings',
      to: { name: ROUTE_SETTINGS_MFA, params: { profileId: selectedUserProfileId.value } },
    },
    {
      text: 'Personal Information',
    },
  ]);

  const backButtonText = 'Back to Settings';
  const backButtonRoute = computed(() => ({ 
    name: ROUTE_SETTINGS_MFA, 
    params: { profileId: selectedUserProfileId.value } 
  }))

  const onUploadId = async (id: string) => {
    isLoading.value = true;
    const body = {
      image_link_id: id,
    };
    await useRepositoryProfilesStore.updateUserData(Number(getUserState.value.data?.id), body);
    useRepositoryProfilesStore.getUser();
  };

  const handleSave = async () => {
    personalFormRef.value?.onValidate();
    if (!isValid.value) {
      nextTick(() => scrollToError('VFormAccount'));
      return;
    }

    isLoading.value = true;
    const { email, ...body } = (personalFormRef.value?.model || {}) as Record<string, unknown>;
    await useRepositoryProfilesStore.setUser(body as any);
    if (setUserState.value.error) {
      isLoading.value = false;
      return;
    }
    await useRepositoryProfilesStore.getUser();
    isLoading.value = false;
    submitFormToHubspot({ ...(personalFormRef.value?.model as Record<string, unknown>) });
    toast(TOAST_OPTIONS);
    router.push({ name: ROUTE_SETTINGS_MFA, params: { profileId: selectedUserProfileId.value } });
  };

  let debounceTimeout: NodeJS.Timeout | null = null;
  watch(notificationFieldsState, () => {
    if (!getUserState.value.loading) {
      // Clear any existing timeout
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      
      // Set new timeout with 3 second delay
      debounceTimeout = setTimeout(async () => {
        await useRepositoryProfilesStore.getUser();
        isLoading.value = false;
        debounceTimeout = null; // Reset timeout reference
      }, 3000);
    }
  }, { deep: true });

  return {
    // State
    isLoading,
    isValid,
    isDisabledButton,
    userData,
    personalFormRef,
    
    // Computed
    breadcrumbs,
    backButtonText,
    backButtonRoute,
    
    // Methods
    onUploadId,
    handleSave,
    
    // Store references for template access
    getUserState,
  };
}
