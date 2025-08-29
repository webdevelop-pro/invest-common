import { computed, ref, watch } from 'vue';
import { SELFSERVICE } from 'InvestCommon/features/settings/utils';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import { urlResetPassword } from 'InvestCommon/domain/config/links';
import { useRepositorySettings } from 'InvestCommon/data/settings/settings.repository';
import { useToast } from 'UiKit/components/Base/VToast/use-toast';
import { storeToRefs } from 'pinia';

export function useSettingsMfa() {
  const settingsRepository = useRepositorySettings();
  const { flowId, csrfToken, setSettingsState, getAuthFlowState } = storeToRefs(settingsRepository);
  const { toast } = useToast();

  const isDialogMfaOpen = ref(false);
  const isMfaEnabled = ref(false);

  const totpUnlink = computed(() => {
    const tokenItem = getAuthFlowState.value.data?.ui?.nodes?.find((item: any) => item.attributes.name === 'totp_unlink');
    return tokenItem;
  });

  const mfaSwitchText = computed(() => (
    isMfaEnabled.value ? 'Multi-factor authentication is now enabled.' : 'Enable multi-factor authentication'
  ));

  const mfaInfoText = computed(() => (
    isMfaEnabled.value ? 'Your account is protected with an extra layer of security.' : 'An extra level of protection to your account during login'
  ));

  const onResetPasswordClick = () => {
    navigateWithQueryParams(urlResetPassword);
  };

  const onMfaClick = async () => {
    if (isMfaEnabled.value && !totpUnlink.value) {
      // open MFA dialog
      isDialogMfaOpen.value = true;
    } else if (totpUnlink.value) {
      // unlink
      await settingsRepository.setSettings(flowId.value, {
        method: 'totp',
        totp_unlink: true,
        csrf_token: csrfToken.value,
      }, onMfaClick);
      await settingsRepository.getAuthFlow(SELFSERVICE.settings);

      if (!setSettingsState.value.error) {
        toast({
          title: 'Submitted',
          description: 'Unlinked',
          variant: 'success',
        });
      }
    }
  };

  const initializeMfa = async () => {
    if (!getAuthFlowState.value.data) {
      await settingsRepository.getAuthFlow(SELFSERVICE.settings);
    }
  };

  // Watchers
  watch(() => isDialogMfaOpen.value, () => {
    if (!isDialogMfaOpen.value) {
      isMfaEnabled.value = totpUnlink.value;
    }
  });

  watch(() => totpUnlink.value, () => {
    isMfaEnabled.value = totpUnlink.value;
  }, { immediate: true });

  return {
    // State
    isDialogMfaOpen,
    isMfaEnabled,
    totpUnlink,
    
    // Computed
    mfaSwitchText,
    mfaInfoText,
    
    // Methods
    onResetPasswordClick,
    onMfaClick,
    initializeMfa,
  };
}
