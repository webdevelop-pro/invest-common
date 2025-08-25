import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref, nextTick } from 'vue';

vi.mock('InvestCommon/data/settings/settings.repository', () => ({
  useRepositorySettings: vi.fn()
}));

vi.mock('InvestCommon/composable/useFormValidation', () => ({
  useFormValidation: vi.fn()
}));

vi.mock('UiKit/components/Base/VToast/use-toast', () => ({
  useToast: vi.fn()
}));

vi.mock('UiKit/helpers/validation/general', () => ({
  scrollToError: vi.fn()
}));

vi.mock('vue', async () => {
  const actual = await vi.importActual('vue');
  return { ...actual, onMounted: vi.fn() };
});

import { useVFormSettingsTOTP } from '../useVFormSettingsTOTP';

describe('useVFormSettingsTOTP', () => {
  let composable: ReturnType<typeof useVFormSettingsTOTP>;
  let mockSettingsRepository: any;
  let mockFormValidation: any;
  let mockToast: any;
  let mockScrollToError: any;

  beforeEach(async () => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockSettingsRepository = {
      flowId: ref('test-flow-id'),
      csrfToken: ref('test-csrf-token'),
      setSettingsState: ref({ error: null }),
      getAuthFlowState: ref({
        data: {
          ui: {
            nodes: [
              { attributes: { id: 'totp_qr', src: 'data:image/png;base64,test-qr-code' } },
              { attributes: { id: 'totp_secret_key', text: { text: 'JBSWY3DPEHPK3PXP' } } }
            ]
          }
        },
        error: null
      }),
      getAuthFlow: vi.fn().mockResolvedValue(undefined),
      setSettings: vi.fn().mockResolvedValue(undefined)
    };

    mockFormValidation = {
      model: ref({ totp_code: 123456 }),
      validation: ref({}),
      isValid: ref(true),
      onValidate: vi.fn()
    };

    mockToast = { toast: vi.fn() };
    mockScrollToError = vi.fn();
    const { useRepositorySettings } = await import('InvestCommon/data/settings/settings.repository');
    const { useFormValidation } = await import('InvestCommon/composable/useFormValidation');
    const { useToast } = await import('UiKit/components/Base/VToast/use-toast');
    const { scrollToError } = await import('UiKit/helpers/validation/general');
    const { onMounted } = await import('vue');

    vi.mocked(useRepositorySettings).mockReturnValue(mockSettingsRepository);
    vi.mocked(useFormValidation).mockReturnValue(mockFormValidation);
    vi.mocked(useToast).mockReturnValue(mockToast);
    vi.mocked(scrollToError).mockImplementation(mockScrollToError);
    vi.mocked(onMounted).mockImplementation((fn: any) => fn?.());

    composable = useVFormSettingsTOTP();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Computed Properties', () => {
    it('should extract QR code and secret from auth flow state', () => {
      expect(composable.totpQR.value).toBe('data:image/png;base64,test-qr-code');
      expect(composable.totpSecret.value).toBe('JBSWY3DPEHPK3PXP');
    });

    it('should extract error information', () => {
      mockSettingsRepository.setSettingsState.value.error = {
        data: {
          responseJson: {
            ui: {
              nodes: [
                { attributes: { name: 'totp_code' }, messages: [{ text: 'Invalid code' }] }
              ]
            }
          }
        }
      };
      expect(composable.totpCodeError.value).toBe('Invalid code');
    });
  });

  describe('onSave Method', () => {
    it('should validate form and handle validation failure', async () => {
      mockFormValidation.isValid.value = false;
      await composable.onSave();
      
      expect(mockFormValidation.onValidate).toHaveBeenCalled();
      expect(mockScrollToError).toHaveBeenCalledWith('VFormSettingsTOTP');
      expect(mockSettingsRepository.setSettings).not.toHaveBeenCalled();
    });

    it('should get auth flow if flowId is missing', async () => {
      mockSettingsRepository.flowId.value = null;
      await composable.onSave();
      expect(mockSettingsRepository.getAuthFlow).toHaveBeenCalledWith('/self-service/settings/browser');
    });

    it('should return early if auth flow has error', async () => {
      mockSettingsRepository.getAuthFlowState.value.error = 'Auth error';
      const result = await composable.onSave();
      expect(result).toBeUndefined();
    });

    it('should call setSettings and show success toast', async () => {
      mockSettingsRepository.setSettingsState.value.error = null;
      const result = await composable.onSave();
      
      expect(mockSettingsRepository.setSettings).toHaveBeenCalled();
      expect(mockToast.toast).toHaveBeenCalledWith({
        title: 'Submitted',
        description: 'Setup confirmed',
        variant: 'success'
      });
      expect(result).toBe(true);
    });

    it('should handle errors and set loading state', async () => {
      mockSettingsRepository.setSettings.mockRejectedValueOnce(new Error('API Error'));
      
      const savePromise = composable.onSave();
      expect(composable.isLoading.value).toBe(true);
      
      const result = await savePromise;
      expect(result).toBe(false);
      expect(composable.isLoading.value).toBe(false);
    });
  });

  describe('initializeTOTP Method', () => {
    it('should initialize TOTP setup', async () => {
      await composable.initializeTOTP();
      
      expect(mockSettingsRepository.getAuthFlow).toHaveBeenCalledWith('/self-service/settings/browser');
      expect(composable.qrOnMounted.value).toBe('data:image/png;base64,test-qr-code');
    });

    it('should clear existing errors', async () => {
      mockSettingsRepository.setSettingsState.value.error = 'Previous error';
      await composable.initializeTOTP();
      expect(mockSettingsRepository.setSettingsState.value.error).toBeNull();
    });
  });

  describe('Reactivity', () => {
    it('should react to state changes', async () => {
      const initialQR = composable.totpQR.value;
      
      mockSettingsRepository.getAuthFlowState.value.data.ui.nodes = [
        { attributes: { id: 'totp_qr', src: 'new-qr-code' } }
      ];
      
      await nextTick();
      expect(composable.totpQR.value).toBe('new-qr-code');
      expect(composable.totpQR.value).not.toBe(initialQR);
    });
  });
});
