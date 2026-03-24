import { ref, computed, useTemplateRef, nextTick } from 'vue';
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
import env from 'InvestCommon/config/env';
import { reportError } from 'InvestCommon/domain/error/errorReporting';
import { useFilerNotificationRefresh } from 'InvestCommon/domain/filer/useFilerNotificationRefresh';

export function useSettingsAccountDetails() {
  const globalLoader = useGlobalLoader();
  globalLoader.hide();

  const userProfileStore = useProfilesStore();
  const { selectedUserProfileId } = storeToRefs(userProfileStore);
  const useRepositoryProfilesStore = useRepositoryProfiles();
  const { getUserState, setUserState } = storeToRefs(useRepositoryProfilesStore);

  const router = useRouter();
  const userSessionStore = useSessionStore();
  const { userSessionTraits } = storeToRefs(userSessionStore);

  const { toast } = useToast();
  const TOAST_OPTIONS = { title: 'Submitted!', variant: 'success' as const };

  const personalFormRef = useTemplateRef<FormChild>('personalFormChild');

  const { submitFormToHubspot } = useHubspotForm(env.HUBSPOT_FORM_ID_ACCOUNT);

  const isLoading = ref(false);
  const isAvatarLoading = ref(false);
  const isValid = computed(() => (personalFormRef.value?.isValid));
  const isDisabledButton = computed(() => (!isValid.value || setUserState.value.loading));
  const avatarLoadingState = computed(() => getUserState.value.loading || isAvatarLoading.value);
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
  }));

  useFilerNotificationRefresh({
    delayMs: 3000,
    enabled: computed(() => !getUserState.value.loading && !isAvatarLoading.value),
    match: (fields) => fields.type !== 'file_thumbnail',
    refresh: () => useRepositoryProfilesStore.getUser(),
    refreshErrorMessage: 'Failed to refresh user data',
  });

  const {
    clearPendingRefresh: clearAvatarNotificationRefresh,
    scheduleFallbackRefresh,
  } = useFilerNotificationRefresh({
    enabled: isAvatarLoading,
    fallbackMs: 5000,
    match: (fields) => fields.type === 'file_thumbnail',
    refresh: () => useRepositoryProfilesStore.getUser(),
    refreshErrorMessage: 'Failed to refresh avatar after thumbnail generation',
    fallbackErrorMessage: 'Failed to refresh avatar after upload',
    onSettled: () => {
      isAvatarLoading.value = false;
    },
  });

  const finishAvatarRefresh = () => {
    clearAvatarNotificationRefresh();
    isAvatarLoading.value = false;
  };

  const onUploadId = async (id: string) => {
    isAvatarLoading.value = true;
    const body = {
      image_link_id: id,
    };
    try {
      await useRepositoryProfilesStore.updateUserData(body as Record<string, unknown>);
      await useRepositoryProfilesStore.getUser();
      scheduleFallbackRefresh();
    } catch (error) {
      reportError(error, 'Failed to update avatar');
      finishAvatarRefresh();
    }
  };

  const handleSave = async () => {
    personalFormRef.value?.onValidate();
    if (!isValid.value) {
      nextTick(() => scrollToError('VFormAccount'));
      return;
    }

    isLoading.value = true;
    try {
      const { email, ...body } = (personalFormRef.value?.model || {}) as Record<string, unknown>;
      await useRepositoryProfilesStore.setUser(body as any);
      if (setUserState.value.error) {
        return;
      }
      await useRepositoryProfilesStore.getUser();
      } catch (error) {
      reportError(error, 'Failed to update account details');
    } finally {
      isLoading.value = false;
    }
    submitFormToHubspot({ ...(personalFormRef.value?.model as Record<string, unknown>) });
    toast(TOAST_OPTIONS);
    router.push({ name: ROUTE_SETTINGS_MFA, params: { profileId: selectedUserProfileId.value } });
    
  };

  return {
    // State
    avatarLoadingState,
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
