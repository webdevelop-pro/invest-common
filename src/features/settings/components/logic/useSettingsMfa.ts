import { computed, ref, watch } from 'vue';
import { SELFSERVICE } from 'InvestCommon/data/auth/auth.constants';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import { urlResetPassword } from 'InvestCommon/domain/config/links';
import { useRepositorySettings } from 'InvestCommon/data/settings/settings.repository';
import { useToast } from 'UiKit/components/Base/VToast/use-toast';
import { storeToRefs } from 'pinia';
import { useSendAnalyticsEvent } from 'InvestCommon/domain/analytics/useSendAnalyticsEvent';
import { oryErrorHandling } from 'InvestCommon/domain/error/oryErrorHandling';
import { oryResponseHandling } from 'InvestCommon/domain/error/oryResponseHandling';

export function useSettingsMfa() {
  const settingsRepository = useRepositorySettings();
  const { flowId, csrfToken, setSettingsState, getAuthFlowState } = storeToRefs(settingsRepository);
  const { toast } = useToast();
  const { sendEvent } = useSendAnalyticsEvent();

  const resetSettingsFlow = () => {
    void settingsRepository
      .getAuthFlow(SELFSERVICE.settings)
      .then((flow) => oryResponseHandling(flow as any));
  };

  const trackMfaEvent = (statusCode: number, body?: unknown) => {
    const uiPath = typeof window !== 'undefined' ? window.location.pathname : '';
    void sendEvent({
      event_type: 'send',
      method: 'POST',
      httpRequestMethod: 'POST',
      service_name: 'vue3-app',
      request_id: flowId.value,
      request_path: uiPath,
      httpRequestUrl: SELFSERVICE.settings,
      status_code: statusCode,
      body,
    });
  };

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
      const unlinkRequestBody = {
        method: 'totp',
        totp_unlink: true,
        csrf_token: csrfToken.value,
      };
      try {
        await settingsRepository.setSettings(flowId.value, unlinkRequestBody);
        const flowData = await settingsRepository.getAuthFlow(SELFSERVICE.settings);
        oryResponseHandling(flowData as any);

        if (!setSettingsState.value.error) {
          toast({
            title: 'Submitted',
            description: 'Unlinked',
            variant: 'success',
          });
          trackMfaEvent(200, unlinkRequestBody);
        }
      } catch (error) {
        trackMfaEvent(400, unlinkRequestBody);
        await oryErrorHandling(
          error as any,
          'settings',
          resetSettingsFlow,
          'Failed to unlink MFA',
          onMfaClick,
        );
      }
    }
  };

  const initializeMfa = async () => {
    if (!getAuthFlowState.value.data) {
      try {
        const flowData = await settingsRepository.getAuthFlow(SELFSERVICE.settings);
        oryResponseHandling(flowData as any);
      } catch (error) {
        await oryErrorHandling(
          error as any,
          'settings',
          resetSettingsFlow,
          'Failed to load MFA settings',
        );
      }
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
