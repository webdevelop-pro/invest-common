import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref, nextTick } from 'vue';
import { useRepositorySettings } from 'InvestCommon/data/settings/settings.repository';
import { useVFormSettingsTOTP } from '../useVFormSettingsTOTP';

const mockFlowId = ref('test-flow-id');
const mockCsrfToken = ref('test-csrf-token');
const mockSetSettingsState = ref<{ error: any }>({ error: null });
const mockGetAuthFlowState = ref<any>({
  data: {
    ui: {
      nodes: [
        { attributes: { id: 'totp_qr', src: 'data:image/png;base64,test-qr-code' } },
        { attributes: { id: 'totp_secret_key', text: { text: 'JBSWY3DPEHPK3PXP' } } }
      ]
    }
  },
  error: null
});

const mockSettingsRepository = {
  flowId: mockFlowId,
  csrfToken: mockCsrfToken,
  setSettingsState: mockSetSettingsState,
  getAuthFlowState: mockGetAuthFlowState,
  getAuthFlow: vi.fn().mockResolvedValue(undefined),
  setSettings: vi.fn().mockResolvedValue(undefined)
};

vi.mock('InvestCommon/data/settings/settings.repository', () => ({
  useRepositorySettings: vi.fn(() => mockSettingsRepository),
}));

vi.mock('vue', async () => {
  const actual = await vi.importActual('vue');
  return { ...actual, onMounted: vi.fn() };
});

describe('useVFormSettingsTOTP', () => {
  let composable: ReturnType<typeof useVFormSettingsTOTP>;
  let mockSettingsRepositoryInstance: any;
  let mockOnMounted: any;

  beforeEach(async () => {
    setActivePinia(createPinia());

    mockSettingsRepositoryInstance = vi.mocked(useRepositorySettings)();

    vi.clearAllMocks();

    // Reset mock values
    mockFlowId.value = 'test-flow-id';
    mockCsrfToken.value = 'test-csrf-token';
    mockSetSettingsState.value = { error: null };
    mockGetAuthFlowState.value = {
      data: {
        ui: {
          nodes: [
            { attributes: { id: 'totp_qr', src: 'data:image/png;base64,test-qr-code' } },
            { attributes: { id: 'totp_secret_key', text: { text: 'JBSWY3DPEHPK3PXP' } } }
          ]
        }
      },
      error: null
    };

    // Mock onMounted
    const { onMounted } = await import('vue');
    mockOnMounted = vi.mocked(onMounted);
    mockOnMounted.mockImplementation((fn: any) => fn?.());

    composable = useVFormSettingsTOTP();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct default values', () => {
      expect(composable.qrOnMounted.value).toBe('data:image/png;base64,test-qr-code');
      expect(composable.isLoading.value).toBe(false);
      expect(composable.model.totp_code).toBeUndefined();
      expect(composable.isValid).toBeDefined();
    });

    it('should auto-initialize TOTP on mount', () => {
      expect(mockOnMounted).toHaveBeenCalled();
      expect(mockSettingsRepositoryInstance.getAuthFlow).toHaveBeenCalledWith('/self-service/settings/browser');
    });

    it('should extract QR code and secret from auth flow state', () => {
      expect(composable.totpQR.value).toBe('data:image/png;base64,test-qr-code');
      expect(composable.totpSecret.value).toBe('JBSWY3DPEHPK3PXP');
    });

    it('should handle missing QR code and secret gracefully', () => {
      mockGetAuthFlowState.value.data.ui.nodes = [];
      
      const newComposable = useVFormSettingsTOTP();
      
      expect(newComposable.totpQR.value).toBe('');
      expect(newComposable.totpSecret.value).toBe('');
    });
  });

  describe('Schema and validation', () => {
    it('should generate correct JSON schema structure', () => {
      expect(composable.schema.$schema).toBe('http://json-schema.org/draft-07/schema#');
      expect(composable.schema.$ref).toBe('#/definitions/Auth');
      expect(composable.schema.definitions?.Auth).toBeDefined();
      expect(composable.schema.definitions?.Auth.type).toBe('object');
      expect(composable.schema.definitions?.Auth.required).toEqual(['totp_code']);
    });
  });

  describe('Error handling', () => {
    it('should extract error information correctly', () => {
      mockSetSettingsState.value.error = {
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

      const newComposable = useVFormSettingsTOTP();
      expect(newComposable.totpCodeError.value).toBe('Invalid code');
    });
  });

  describe('onSave method', () => {
    describe('Validation failure', () => {
      it('should not proceed when form validation fails', async () => {
        // Set the model to an invalid state
        composable.model.totp_code = undefined;
        
        const result = await composable.onSave();
        
        expect(mockSettingsRepositoryInstance.setSettings).not.toHaveBeenCalled();
        expect(result).toBeUndefined();
      });
    });

    describe('Success scenarios', () => {
      beforeEach(() => {
        mockSetSettingsState.value.error = null;
      });

      it('should save TOTP settings successfully and show success toast', async () => {
        // Set a valid TOTP code
        composable.model.totp_code = 123456;
        
        const result = await composable.onSave();
        
        expect(mockSettingsRepositoryInstance.setSettings).toHaveBeenCalledWith(
          'test-flow-id',
          {
            method: 'totp',
            totp_code: '123456',
            csrf_token: 'test-csrf-token',
          },
          expect.any(Function)
        );
        expect(result).toBe(true);
      });

      it('should get auth flow if flowId is missing', async () => {
        mockFlowId.value = null;
        
        await composable.onSave();
        
        expect(mockSettingsRepositoryInstance.getAuthFlow).toHaveBeenCalledWith('/self-service/settings/browser');
      });

      it('should return early if auth flow has error', async () => {
        mockGetAuthFlowState.value.error = 'Auth error';
        
        const result = await composable.onSave();
        
        expect(result).toBeUndefined();
        expect(mockSettingsRepositoryInstance.setSettings).not.toHaveBeenCalled();
      });
    });

    describe('Error handling', () => {
      it('should handle API errors gracefully', async () => {
        // Set a valid TOTP code first so validation passes
        composable.model.totp_code = 123456;
        
        mockSettingsRepositoryInstance.setSettings.mockRejectedValueOnce(new Error('API Error'));
        
        const result = await composable.onSave();
        
        expect(result).toBe(false);
        expect(composable.isLoading.value).toBe(false);
      });

      it('should manage loading state correctly', async () => {
        // Set a valid TOTP code first so validation passes
        composable.model.totp_code = 123456;
        
        mockSettingsRepositoryInstance.setSettings.mockResolvedValue(undefined);
        
        const savePromise = composable.onSave();
        expect(composable.isLoading.value).toBe(true);
        
        await savePromise;
        expect(composable.isLoading.value).toBe(false);
      });

      it('should handle setSettings errors gracefully', async () => {
        // Set a valid TOTP code first so validation passes
        composable.model.totp_code = 123456;
        
        // Mock setSettings to succeed but set an error in the state
        mockSettingsRepositoryInstance.setSettings.mockResolvedValue(undefined);
        mockSetSettingsState.value.error = new Error('Settings error');
        
        const result = await composable.onSave();
        
        expect(result).toBe(false);
      });
    });
  });

  describe('initializeTOTP method', () => {
    it('should initialize TOTP setup successfully', async () => {
      await composable.initializeTOTP();
      
      expect(mockSettingsRepositoryInstance.getAuthFlow).toHaveBeenCalledWith('/self-service/settings/browser');
      expect(composable.qrOnMounted.value).toBe('data:image/png;base64,test-qr-code');
    });

    it('should update QR code on mounted after initialization', async () => {
      const newQRCode = 'data:image/png;base64,new-qr-code';
      mockGetAuthFlowState.value.data.ui.nodes = [
        { attributes: { id: 'totp_qr', src: newQRCode } }
      ];
      
      await composable.initializeTOTP();
      
      expect(composable.qrOnMounted.value).toBe(newQRCode);
    });
  });

  describe('Reactive behavior', () => {
    it('should react to auth flow state changes', async () => {
      const initialQR = composable.totpQR.value;
      
      mockGetAuthFlowState.value.data.ui.nodes = [
        { attributes: { id: 'totp_qr', src: 'new-qr-code' } }
      ];
      
      await nextTick();
      
      expect(composable.totpQR.value).toBe('new-qr-code');
      expect(composable.totpQR.value).not.toBe(initialQR);
    });
  });

  describe('Integration workflow', () => {
    it('should handle complete successful TOTP setup workflow', async () => {
      const testData = {
        flowId: 'flow-123',
        csrfToken: 'csrf-123',
        totpCode: 123456
      };

      mockFlowId.value = testData.flowId;
      mockCsrfToken.value = testData.csrfToken;
      mockSetSettingsState.value.error = null;

      // Create a new composable instance with the updated mock values
      const testComposable = useVFormSettingsTOTP();
      
      // Update the model value in the new composable
      testComposable.model.totp_code = testData.totpCode;

      const result = await testComposable.onSave();

      expect(result).toBe(true);
      expect(mockSettingsRepositoryInstance.setSettings).toHaveBeenCalledWith(
        testData.flowId,
        {
          method: 'totp',
          totp_code: testData.totpCode.toString(),
          csrf_token: testData.csrfToken,
        },
        expect.any(Function)
      );
    });
  });
});
