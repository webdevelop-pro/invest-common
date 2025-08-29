import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref, nextTick } from 'vue';

vi.mock('InvestCommon/data/settings/settings.repository', () => ({
  useRepositorySettings: vi.fn()
}));

vi.mock('UiKit/components/Base/VToast/use-toast', () => ({
  useToast: vi.fn()
}));

vi.mock('UiKit/helpers/general', () => ({
  navigateWithQueryParams: vi.fn()
}));

vi.mock('InvestCommon/domain/config/links.ts', () => ({
  urlResetPassword: '/reset-password'
}));

vi.mock('InvestCommon/features/settings/utils', () => ({
  SELFSERVICE: {
    settings: '/self-service/settings/browser'
  }
}));

import { useSettingsMfa } from '../useSettingsMfa';

describe('useSettingsMfa', () => {
  let composable: ReturnType<typeof useSettingsMfa>;
  let mockSettingsRepository: any;
  let mockToast: any;
  let mockNavigateWithQueryParams: any;

  beforeEach(async () => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    
    mockToast = vi.fn();
    mockNavigateWithQueryParams = vi.fn();

    const mockGetAuthFlowState = ref({
      data: {
        id: 'flow-123',
        ui: {
          nodes: [
            { attributes: { name: 'csrf_token', value: 'csrf-token-123' } },
            { attributes: { name: 'totp_unlink', value: true } }
          ]
        }
      },
      loading: false,
      error: null
    });

    const mockSetSettingsState = ref({
      data: null,
      loading: false,
      error: null
    });

    mockSettingsRepository = {
      getAuthFlowState: mockGetAuthFlowState,
      setSettingsState: mockSetSettingsState,
      flowId: ref('flow-123'),
      csrfToken: ref('csrf-token-123'),
      setSettings: vi.fn().mockResolvedValue({}),
      getAuthFlow: vi.fn().mockResolvedValue({})
    };

    const { useRepositorySettings } = await import('InvestCommon/data/settings/settings.repository');
    const { useToast } = await import('UiKit/components/Base/VToast/use-toast');
    const { navigateWithQueryParams } = await import('UiKit/helpers/general');

    vi.mocked(useRepositorySettings).mockReturnValue(mockSettingsRepository);
    vi.mocked(useToast).mockReturnValue({ toast: mockToast });
    vi.mocked(navigateWithQueryParams).mockImplementation(mockNavigateWithQueryParams);
    
    composable = useSettingsMfa();
  });

  describe('Initialization', () => {
    it('should initialize with correct default values', () => {
      expect(composable.isDialogMfaOpen.value).toBe(false);
      expect(composable.totpUnlink.value).toBeDefined();
      expect(composable.isMfaEnabled.value).toBe(composable.totpUnlink.value);
    });

    it('should show correct text when MFA is enabled vs disabled', async () => {
      expect(composable.mfaSwitchText.value).toBe('Multi-factor authentication is now enabled.');
      expect(composable.mfaInfoText.value).toBe('Your account is protected with an extra layer of security.');

      mockSettingsRepository.getAuthFlowState.value.data.ui.nodes = [
        { attributes: { name: 'csrf_token', value: 'csrf-token-123' } }
      ];
      
      await nextTick();
      
      expect(composable.mfaSwitchText.value).toBe('Enable multi-factor authentication');
      expect(composable.mfaInfoText.value).toBe('An extra level of protection to your account during login');
    });
  });

  describe('Core Methods', () => {
    it('should navigate to reset password', () => {
      composable.onResetPasswordClick();
      expect(mockNavigateWithQueryParams).toHaveBeenCalledWith('/reset-password');
    });

    it('should unlink MFA when totp_unlink exists', async () => {
      await composable.onMfaClick();
      
      expect(mockSettingsRepository.setSettings).toHaveBeenCalledWith(
        'flow-123',
        {
          method: 'totp',
          totp_unlink: true,
          csrf_token: 'csrf-token-123'
        },
        expect.any(Function)
      );
      expect(mockSettingsRepository.getAuthFlow).toHaveBeenCalledWith('/self-service/settings/browser');
    });

    it('should show success toast when unlinking succeeds', async () => {
      mockSettingsRepository.setSettingsState.value.error = null;

      await composable.onMfaClick();
      
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Submitted',
        description: 'Unlinked',
        variant: 'success'
      });
    });

    it('should initialize auth flow when needed', async () => {
      mockSettingsRepository.getAuthFlowState.value.data = null;

      await composable.initializeMfa();
      
      expect(mockSettingsRepository.getAuthFlow).toHaveBeenCalledWith('/self-service/settings/browser');
    });
  });

  describe('Reactive Behavior', () => {
    it('should update state when totpUnlink changes', async () => {
      mockSettingsRepository.getAuthFlowState.value.data.ui.nodes = [
        { attributes: { name: 'csrf_token', value: 'csrf-token-123' } }
      ];

      await nextTick();
      
      expect(composable.totpUnlink.value).toBeUndefined();
      expect(composable.isMfaEnabled.value).toBe(composable.totpUnlink.value);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const error = new Error('API Error');
      mockSettingsRepository.setSettings.mockRejectedValueOnce(error);

      await expect(composable.onMfaClick()).rejects.toThrow('API Error');
    });

    it('should not show toast when unlinking fails', async () => {
      mockSettingsRepository.setSettingsState.value.error = new Error('Failed');

      await composable.onMfaClick();
      
      expect(mockToast).not.toHaveBeenCalled();
    });
  });
});