import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';
import { ROUTE_SETTINGS_MFA } from 'InvestCommon/domain/config/enums/routes';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { useSettingsAccountDetails } from '../useSettingsAccountDetails';

vi.mock('InvestCommon/domain/config/env', () => ({
  default: { HUBSPOT_FORM_ID_ACCOUNT: 'test-hubspot-form-id' }
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

const mockUpdateUserData = vi.fn().mockResolvedValue(undefined);
const mockSetUser = vi.fn().mockResolvedValue(undefined);
const mockGetUser = vi.fn().mockResolvedValue(undefined);

const mockGetUserState = ref({ data: { id: 123, name: 'Test User' } });
const mockSetUserState = ref({ loading: false, error: null });

vi.mock('InvestCommon/data/profiles/profiles.repository', () => ({
  useRepositoryProfiles: vi.fn(() => ({
    getUserState: mockGetUserState,
    setUserState: mockSetUserState,
    updateUserData: mockUpdateUserData,
    setUser: mockSetUser,
    getUser: mockGetUser
  }))
}));

const mockSubmitFormToHubspot = vi.fn().mockResolvedValue(undefined);
vi.mock('UiKit/composables/useHubspotForm', () => ({
  useHubspotForm: vi.fn(() => ({ submitFormToHubspot: mockSubmitFormToHubspot }))
}));

const mockToast = vi.fn();
vi.mock('UiKit/components/Base/VToast/use-toast', () => ({
  useToast: vi.fn(() => ({ toast: mockToast }))
}));

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: vi.fn(() => ({ userSessionTraits: ref({ email: 'test@example.com', first_name: 'Test' }) }))
}));

vi.mock('UiKit/helpers/validation/general', () => ({
  scrollToError: vi.fn()
}));

const mockFormRef = {
  value: {
    isValid: true,
    model: { email: 'test@example.com', first_name: 'Test', last_name: 'User' },
    onValidate: vi.fn()
  }
};

vi.mock('vue', async () => {
  const actual = await vi.importActual('vue');
  return { 
    ...actual, 
    useTemplateRef: vi.fn(() => mockFormRef),
    nextTick: vi.fn((callback) => {
      if (callback) callback();
      return Promise.resolve();
    })
  };
});

describe('useSettingsAccountDetails', () => {
  let composable: ReturnType<typeof useSettingsAccountDetails>;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    
    mockFormRef.value.isValid = true;
    mockFormRef.value.model = { email: 'test@example.com', first_name: 'Test', last_name: 'User' };
    mockGetUserState.value = { data: { id: 123, name: 'Test User' } };
    mockSetUserState.value = { loading: false, error: null };
    
    composable = useSettingsAccountDetails();
  });

  describe('Computed Properties', () => {
    it('should compute isValid from form ref', () => {
      expect(composable.isValid.value).toBe(true);
      
      mockFormRef.value.isValid = false;
      const invalidComposable = useSettingsAccountDetails();
      expect(invalidComposable.isValid.value).toBe(false);
    });

    it('should compute isDisabledButton correctly', () => {
      expect(composable.isDisabledButton.value).toBe(false);
      
      mockFormRef.value.isValid = false;
      mockSetUserState.value.loading = false;
      const invalidFormComposable = useSettingsAccountDetails();
      expect(invalidFormComposable.isDisabledButton.value).toBe(true);
      
      mockFormRef.value.isValid = true;
      mockSetUserState.value.loading = true;
      const loadingComposable = useSettingsAccountDetails();
      expect(loadingComposable.isDisabledButton.value).toBe(true);
      
      mockFormRef.value.isValid = false;
      mockSetUserState.value.loading = true;
      const invalidAndLoadingComposable = useSettingsAccountDetails();
      expect(invalidAndLoadingComposable.isDisabledButton.value).toBe(true);
    });

    it('should merge user data correctly', () => {
      const expectedData = {
        email: 'test@example.com',
        first_name: 'Test',
        id: 123,
        name: 'Test User'
      };
      expect(composable.userData.value).toEqual(expectedData);
    });
  });

  describe('Methods', () => {
    describe('handleSave', () => {
      it('should handle form validation and save flow', async () => {
        await composable.handleSave();
        
        expect(mockFormRef.value.onValidate).toHaveBeenCalled();
        
        expect(mockSetUser).toHaveBeenCalledWith({
          first_name: 'Test',
          last_name: 'User'
        });
        
        expect(mockGetUser).toHaveBeenCalled();
        
        expect(mockSubmitFormToHubspot).toHaveBeenCalledWith({
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User'
        });
        
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Submitted!',
          variant: 'success'
        });
        
        expect(mockPush).toHaveBeenCalledWith({
          name: ROUTE_SETTINGS_MFA,
          params: { profileId: 'test-profile-id' }
        });
      });

      it('should handle validation errors', async () => {
        mockFormRef.value.isValid = false;
        
        await composable.handleSave();
        
        expect(scrollToError).toHaveBeenCalledWith('VFormAccount');
        expect(composable.isLoading.value).toBe(false);
      });

      it('should handle save errors', async () => {
        mockSetUserState.value.error = new Error('Save failed');
        
        await composable.handleSave();
        
        expect(composable.isLoading.value).toBe(false);
        expect(mockGetUser).not.toHaveBeenCalled();
      });

      it('should handle loading state correctly', async () => {
        const savePromise = composable.handleSave();
        expect(composable.isLoading.value).toBe(true);
        
        await savePromise;
        expect(composable.isLoading.value).toBe(false);
      });
    });
  });
});
