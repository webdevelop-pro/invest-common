import { ref, computed, nextTick, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { useRepositorySettings } from 'InvestCommon/data/settings/settings.repository';
import { useFormValidation } from 'UiKit/helpers/validation/useFormValidation';
import { useToast } from 'UiKit/components/Base/VToast/use-toast';
import { SELFSERVICE } from 'InvestCommon/data/auth/auth.constants';
import { oryErrorHandling } from 'InvestCommon/domain/error/oryErrorHandling';
import { oryResponseHandling } from 'InvestCommon/domain/error/oryResponseHandling';
import { useSendAnalyticsEvent } from 'InvestCommon/domain/analytics/useSendAnalyticsEvent';

type FormModelTOTP = {
  totp_code: number;
}

export function useVFormSettingsTOTP() {
  const settingsRepository = useRepositorySettings();
  const { flowId, csrfToken, setSettingsState, getAuthFlowState } = storeToRefs(settingsRepository);

  const { toast } = useToast();
  const { sendEvent } = useSendAnalyticsEvent();

  const trackTotpEvent = (statusCode: number, body?: unknown) => {
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

  const qrOnMounted = ref('');
  const isLoading = ref(false);

  const resetSettingsFlow = () => {
    void settingsRepository
      .getAuthFlow(SELFSERVICE.settings)
      .then((flow) => oryResponseHandling(flow as any));
  };

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

  const buildTotpRequestBody = () => ({
    method: 'totp' as const,
    totp_code: model.totp_code?.toString() || '',
    csrf_token: csrfToken.value,
  });

  const onSave = async () => {
    onValidate();
    if (!isValid.value) {
      nextTick(() => scrollToError('VFormSettingsTOTP'));
      return;
    }

    let totpRequestBody: ReturnType<typeof buildTotpRequestBody> | undefined;
    isLoading.value = true;
    try {
      if (!flowId.value) {
        const flowData = await settingsRepository.getAuthFlow(SELFSERVICE.settings);
        oryResponseHandling(flowData as any);
      }
      
      if (getAuthFlowState.value.error) {
        isLoading.value = false;
        return;
      }

      totpRequestBody = buildTotpRequestBody();
      await settingsRepository.setSettings(flowId.value, totpRequestBody);

      if (!setSettingsState.value.error) {
        settingsRepository.getAuthFlow(SELFSERVICE.settings);
        toast({
          title: 'Submitted',
          description: 'Setup confirmed',
          variant: 'success',
        });
        trackTotpEvent(200, totpRequestBody);
        return true; // Indicate success
      }
    } catch (error) {
      trackTotpEvent(400, totpRequestBody ?? buildTotpRequestBody());
      await oryErrorHandling(
        error as any,
        'settings',
        resetSettingsFlow,
        'Failed to save TOTP',
        onSave,
      );
    } finally {
      isLoading.value = false;
    }
    return false; // Indicate failure
  };

  const initializeTOTP = async () => {
    try {
      const flowData = await settingsRepository.getAuthFlow(SELFSERVICE.settings);
      oryResponseHandling(flowData as any);
      qrOnMounted.value = totpQR.value;
      setSettingsState.value.error = null;
    } catch (error) {
      await oryErrorHandling(
        error as any,
        'settings',
        resetSettingsFlow,
        'Failed to load TOTP settings',
      );
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
