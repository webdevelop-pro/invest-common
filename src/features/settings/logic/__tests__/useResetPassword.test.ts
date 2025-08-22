import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref, reactive } from 'vue';
import { ROUTE_SETTINGS_MFA } from 'InvestCommon/helpers/enums/routes';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { useResetPassword } from '../useResetPassword';

// Mock dependencies
vi.mock('InvestCommon/global/links', () => ({
  urlSettings: vi.fn((profileId: string) => `/settings/${profileId}`)
}));

const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({ push: mockPush }))
}));

vi.mock('UiKit/store/useGlobalLoader', () => ({
  useGlobalLoader: vi.fn(() => ({ hide: vi.fn() }))
}));

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: vi.fn(() => ({ selectedUserProfileId: ref('test-profile-id') }))
}));

const mockGetAuthFlow = vi.fn().mockResolvedValue(undefined);
const mockSetSettings = vi.fn().mockResolvedValue(undefined);

const mockFlowId = ref('test-flow-id');
const mockCsrfToken = ref('test-csrf-token');
const mockSetSettingsState = ref<{ error: any }>({ error: null });
const mockGetAuthFlowState = ref<{ error: any }>({ error: null });

vi.mock('InvestCommon/data/settings/settings.repository', () => ({
  useRepositorySettings: vi.fn(() => ({
    flowId: mockFlowId,
    csrfToken: mockCsrfToken,
    setSettingsState: mockSetSettingsState,
    getAuthFlowState: mockGetAuthFlowState,
    getAuthFlow: mockGetAuthFlow,
    setSettings: mockSetSettings
  }))
}));

const mockToast = vi.fn();
vi.mock('UiKit/components/Base/VToast/use-toast', () => ({
  useToast: vi.fn(() => ({ toast: mockToast }))
}));

const mockModel = reactive({
  create_password: 'TestPassword123!',
  repeat_password: 'TestPassword123!'
});
const mockValidation = ref({});
const mockIsValid = ref(true);
const mockOnValidate = vi.fn();

vi.mock('InvestCommon/composable/useFormValidation', () => ({
  useFormValidation: vi.fn(() => ({
    model: mockModel,
    validation: mockValidation,
    isValid: mockIsValid,
    onValidate: mockOnValidate
  }))
}));

vi.mock('UiKit/helpers/validation/general', () => ({
  scrollToError: vi.fn()
}));

vi.mock('UiKit/helpers/validation/rules', () => ({
  passwordRule: { type: 'string', minLength: 8 },
  errorMessageRule: { type: 'object' }
}));

vi.mock('vue', async () => {
  const actual = await vi.importActual('vue');
  return { 
    ...actual, 
    nextTick: vi.fn((callback) => {
      if (callback) callback();
      return Promise.resolve();
    })
  };
});

describe('useResetPassword', () => {
  let composable: ReturnType<typeof useResetPassword>;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    
    // Reset mock values
    mockIsValid.value = true;
    mockModel.create_password = 'TestPassword123!';
    mockModel.repeat_password = 'TestPassword123!';
    mockSetSettingsState.value = { error: null };
    mockGetAuthFlowState.value = { error: null };
    mockFlowId.value = 'test-flow-id';
    mockCsrfToken.value = 'test-csrf-token';
    
    composable = useResetPassword();
  });

  describe('Computed Properties', () => {
    it('should compute isDisabledButton based on form validity and loading state', () => {
      mockIsValid.value = true;
      composable.isLoading.value = false;
      expect(composable.isDisabledButton.value).toBe(false);
      
      mockIsValid.value = false;
      expect(composable.isDisabledButton.value).toBe(true);
      
      composable.isLoading.value = true;
      expect(composable.isDisabledButton.value).toBe(true);
    });

    it('should compute errorData from setSettingsState', () => {
      const mockError = {
        data: {
          responseJson: {
            create_password: 'Password is too weak',
            repeat_password: 'Passwords do not match'
          }
        }
      };
      mockSetSettingsState.value.error = mockError;
      
      expect(composable.errorData.value).toEqual(mockError.data.responseJson);
    });
  });

  describe('resetHandler Method', () => {
    it('should handle successful password reset flow', async () => {
      await composable.resetHandler();
      
      expect(mockOnValidate).toHaveBeenCalled();
      expect(mockGetAuthFlow).toHaveBeenCalledWith('/self-service/settings/browser');
      expect(mockSetSettings).toHaveBeenCalledWith(
        'test-flow-id',
        {
          password: 'TestPassword123!',
          method: 'password',
          csrf_token: 'test-csrf-token'
        },
        expect.any(Function)
      );
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Submitted',
        description: 'Password reset success',
        variant: 'success'
      });
      expect(mockPush).toHaveBeenCalledWith({
        name: ROUTE_SETTINGS_MFA,
        params: { profileId: 'test-profile-id' }
      });
    });

    it('should handle validation errors and scroll to error', async () => {
      mockIsValid.value = false;
      
      await composable.resetHandler();
      
      expect(mockOnValidate).toHaveBeenCalled();
      expect(scrollToError).toHaveBeenCalledWith('VFormResetPassword');
      expect(mockGetAuthFlow).not.toHaveBeenCalled();
      expect(mockSetSettings).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      mockGetAuthFlowState.value.error = new Error('Auth flow failed');
      await composable.resetHandler();
      expect(composable.isLoading.value).toBe(false);
      
      mockGetAuthFlowState.value.error = null;
      mockSetSettingsState.value.error = new Error('Settings update failed');
      await composable.resetHandler();
      expect(mockToast).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
      expect(composable.isLoading.value).toBe(false);
    });

    it('should handle loading state and exceptions correctly', async () => {
      const resetPromise = composable.resetHandler();
      expect(composable.isLoading.value).toBe(true);
      await resetPromise;
      expect(composable.isLoading.value).toBe(false);
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetAuthFlow.mockRejectedValueOnce(new Error('Network error'));
      
      await composable.resetHandler();
      
      expect(consoleSpy).toHaveBeenCalledWith('Recovery failed:', expect.any(Error));
      expect(composable.isLoading.value).toBe(false);
      
      consoleSpy.mockRestore();
    });
  });

  describe('API Integration', () => {
    it('should call APIs with correct parameters', async () => {
      await composable.resetHandler();
      
      expect(mockGetAuthFlow).toHaveBeenCalledWith('/self-service/settings/browser');
      expect(mockSetSettings).toHaveBeenCalledWith(
        'test-flow-id',
        {
          password: 'TestPassword123!',
          method: 'password',
          csrf_token: 'test-csrf-token'
        },
        expect.any(Function)
      );
    });

    it('should use current flowId and csrfToken values', async () => {
      mockFlowId.value = 'new-flow-id';
      mockCsrfToken.value = 'new-csrf-token';
      
      const newComposable = useResetPassword();
      await newComposable.resetHandler();
      
      expect(mockSetSettings).toHaveBeenCalledWith(
        'new-flow-id',
        {
          password: 'TestPassword123!',
          method: 'password',
          csrf_token: 'new-csrf-token'
        },
        expect.any(Function)
      );
    });
  });
});
