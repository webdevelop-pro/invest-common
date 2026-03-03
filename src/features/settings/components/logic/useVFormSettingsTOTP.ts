import { ref, computed, nextTick, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { useRepositorySettings } from 'InvestCommon/data/settings/settings.repository';
import { useFormValidation } from 'UiKit/helpers/validation/useFormValidation';
import { useToast } from 'UiKit/components/Base/VToast/use-toast';
import { SELFSERVICE } from 'InvestCommon/data/auth/auth.constants';
import { reportError } from 'InvestCommon/domain/error/errorReporting';
import { useSendAnalyticsEvent } from 'InvestCommon/domain/analytics/useSendAnalyticsEvent';

type FormModelTOTP = {
  totp_code: number;
}

export function useVFormSettingsTOTP() {
  const settingsRepository = useRepositorySettings();
  const { flowId, csrfToken, setSettingsState, getAuthFlowState } = storeToRefs(settingsRepository);

  const { toast } = useToast();
  const { sendEvent } = useSendAnalyticsEvent();

  const trackTotpEvent = (statusCode: number) => {
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
    });
  };

  const qrOnMounted = ref(false);
  const isLoading = ref(false);

  const totpQR = computed(() => {
    const tokenItem = getAuthFlowState.value.data?.ui?.nodes?.find((item) => item.attributes.id === 'totp_qr');
    return tokenItem?.attributes?.src ?? '';
  });

  const totpSecret = computed(() => {
    const tokenItem = getAuthFlowState.value.data?.ui?.nodes?.find((item) => item.attributes.id === 'totp_secret_key');
    return tokenItem?.attributes?.text?.text ?? '';
  });

  const errorData = computed(() => (setSettingsState.value.error as any)?.data?.responseJson);

  const schema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
      Auth: {
        properties: {
          totp_code: {},
        },
        type: 'object',
        required: ['totp_code'],
      },
    },
    $ref: '#/definitions/Auth',
  } as unknown as JSONSchemaType<FormModelTOTP>;

  const fieldsPaths = ['totp_code'];

  const {
    model,
    validation,
    isValid,
    onValidate,
    scrollToError, formErrors, isFieldRequired, getErrorText,
    getOptions, getReferenceType,
  } = useFormValidation<FormModelTOTP>(
    schema,
    undefined,
    {} as FormModelTOTP,
    fieldsPaths
  );


  const totpCodeError = computed(() => {
    const tokenItem = errorData.value?.ui?.nodes?.find((item) => item.attributes.name === 'totp_code');
    return tokenItem?.messages?.[0]?.text;
  });

  const errorTotpCode = computed(() => totpCodeError.value || getErrorText('totp_code', errorData.value));

  const onSave = async () => {
    onValidate();
    if (!isValid.value) {
      nextTick(() => scrollToError('VFormSettingsTOTP'));
      return;
    }

    isLoading.value = true;
    try {
      if (!flowId.value) await settingsRepository.getAuthFlow(SELFSERVICE.settings);
      
      if (getAuthFlowState.value.error) {
        isLoading.value = false;
        return;
      }

      await settingsRepository.setSettings(flowId.value, {
        method: 'totp',
        totp_code: model.totp_code?.toString() || '',
        csrf_token: csrfToken.value,
      }, onSave); // Pass resetHandler as callback for retry after session refresh

      if (!setSettingsState.value.error) {
        settingsRepository.getAuthFlow(SELFSERVICE.settings);
        toast({
          title: 'Submitted',
          description: 'Setup confirmed',
          variant: 'success',
        });
        trackTotpEvent(200);
        return true; // Indicate success
      }
    } catch (error) {
      trackTotpEvent(400);
      reportError(error as any, 'Failed to save TOTP');
    } finally {
      isLoading.value = false;
    }
    return false; // Indicate failure
  };

  const initializeTOTP = async () => {
    try {
      await settingsRepository.getAuthFlow(SELFSERVICE.settings);
      qrOnMounted.value = totpQR.value;
      setSettingsState.value.error = null;
    } catch (error) {
      reportError(error as any, 'Failed to load TOTP settings');
    }
  };

  // Auto-initialize on mount
  onMounted(initializeTOTP);

  return {
    // State
    qrOnMounted,
    isLoading,
    
    // Computed
    totpQR,
    totpSecret,
    errorData,
    totpCodeError,
    errorTotpCode,
    
    // Form
    model,
    validation,
    schema,
    isValid,
    
    // Methods
    onSave,
    onValidate,
    initializeTOTP,
    
    // Store references for template access
    getAuthFlowState,
    setSettingsState,
    
    // Form validation helpers
    formErrors,
    isFieldRequired,
    getErrorText,
    getOptions,
    getReferenceType,
    scrollToError,
  };
}
