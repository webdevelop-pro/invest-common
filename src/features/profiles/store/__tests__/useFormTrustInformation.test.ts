import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/helpers/enums/routes';
import { useFormTrustInformation } from '../useFormTrustInformation';

const mockFormRef = ref<any>(null);

vi.mock('vue', async () => {
  const vue = await vi.importActual('vue');
  return {
    ...vue,
    useTemplateRef: vi.fn((name: string) => {
      if (name === 'trustInformationFormChild') {
        return mockFormRef;
      }
      return ref(null);
    }),
  };
});

const mockPush = vi.fn();
const mockRouter = {
  push: mockPush,
};
vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
}));

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: vi.fn(() => ({
    selectedUserProfileId: ref('123'),
    selectedUserProfileType: ref('individual'),
    selectedUserProfileData: ref({
      data: {
        trust_information: {
          trust_name: 'Test Trust',
          trust_address: '123 Trust St',
          trust_city: 'Trust City',
          trust_state: 'TS',
          trust_zip: '12345',
          trust_country: 'US',
        },
      },
    }),
  })),
}));

vi.mock('InvestCommon/data/profiles/profiles.repository', () => ({
  useRepositoryProfiles: vi.fn(() => ({
    setProfileById: vi.fn().mockResolvedValue(undefined),
    getProfileById: vi.fn().mockResolvedValue(undefined),
    setProfileByIdState: ref({ data: null, error: null }),
    getProfileByIdOptionsState: ref({ data: { schema: {} }, error: null }),
  })),
}));

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: vi.fn(() => ({
    userSessionTraits: ref({
      email: 'test@example.com',
    }),
  })),
}));

vi.mock('InvestCommon/composable/useHubspotForm', () => ({
  useHubspotForm: vi.fn(() => ({
    submitFormToHubspot: vi.fn(),
  })),
}));

vi.mock('UiKit/helpers/validation/general', () => {
  return {
    scrollToError: vi.fn(),
  };
});

vi.mock('InvestCommon/global', () => ({
  default: {
    HUBSPOT_FORM_ID_TRUST_INFORMATION: 'trust-info-form-id',
  },
}));

describe('useFormTrustInformation', () => {
  let store: ReturnType<typeof useFormTrustInformation>;

  beforeEach(() => {
    setActivePinia(createPinia());
    
    mockFormRef.value = {
      isValid: true,
      model: {
        trust_name: 'Test Trust',
        trust_address: '123 Trust St',
        trust_city: 'Trust City',
        trust_state: 'TS',
        trust_zip: '12345',
        trust_country: 'US',
      },
      onValidate: vi.fn(),
    };
    
    vi.clearAllMocks();
    
    store = useFormTrustInformation();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      expect(store.backButtonText).toBe('Back to Profile Details');
      expect(store.isLoading).toBe(false);
      expect(store.isDisabledButton).toBe(false);
    });

    it('should have correct breadcrumbs', () => {
      expect(store.breadcrumbs).toEqual([
        {
          text: 'Dashboard',
          to: { name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: '123' } },
        },
        {
          text: 'Profile Details',
          to: { name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: '123' } },
        },
        {
          text: 'Trust Information',
        },
      ]);
    });



    it('should return model data from selected user profile', () => {
      expect(store.modelData).toEqual({
        trust_information: {
          trust_name: 'Test Trust',
          trust_address: '123 Trust St',
          trust_city: 'Trust City',
          trust_state: 'TS',
          trust_zip: '12345',
          trust_country: 'US',
        },
      });
    });
  });

  describe('handleSave', () => {
    let mockSetProfileById: any;
    let mockGetProfileById: any;
    let mockSubmitFormToHubspot: any;
    let handleSaveStore: any;

    beforeEach(() => {
      mockSetProfileById = vi.fn();
      mockGetProfileById = vi.fn();
      mockSubmitFormToHubspot = vi.fn();
      
      const useRepositoryProfilesStore = useRepositoryProfiles();
      useRepositoryProfilesStore.setProfileById = mockSetProfileById;
      useRepositoryProfilesStore.getProfileById = mockGetProfileById;
      
      const mockHubspotForm = useHubspotForm('trust-info-form-id');
      mockHubspotForm.submitFormToHubspot = mockSubmitFormToHubspot;
      
      handleSaveStore = useFormTrustInformation();
    });

    it('should validate form before saving', async () => {
      mockFormRef.value.isValid = true;
      
      await handleSaveStore.handleSave();

      expect(mockFormRef.value.onValidate).toHaveBeenCalled();
    });

    it('should not save when form is invalid', async () => {
      mockFormRef.value.isValid = false;

      await handleSaveStore.handleSave();

      expect(mockSetProfileById).not.toHaveBeenCalled();
    });

    it('should save form data when valid', async () => {
      mockFormRef.value.isValid = true;
      
      await store.handleSave();

      expect(vi.mocked(useRepositoryProfiles)().setProfileById).toHaveBeenCalledWith(
        {
          trust_name: 'Test Trust',
          trust_address: '123 Trust St',
          trust_city: 'Trust City',
          trust_state: 'TS',
          trust_zip: '12345',
          trust_country: 'US',
        },
        'individual',
        '123'
      );
    });

    it('should submit form to Hubspot after successful save', async () => {
      mockFormRef.value.isValid = true;
      
      await handleSaveStore.handleSave();

      expect(mockSubmitFormToHubspot).toHaveBeenCalledWith({
        email: 'test@example.com',
        trust_name: 'Test Trust',
        trust_address: '123 Trust St',
        trust_city: 'Trust City',
        trust_state: 'TS',
        trust_zip: '12345',
        trust_country: 'US',
      });
    });

    it('should refresh profile data after successful save', async () => {
      mockFormRef.value.isValid = true;
      
      await handleSaveStore.handleSave();

      expect(mockGetProfileById).toHaveBeenCalledWith('individual', '123');
    });

    it('should navigate to account page after successful save', async () => {
      mockFormRef.value.isValid = true;
      
      await handleSaveStore.handleSave();

      expect(mockPush).toHaveBeenCalledWith({
        name: ROUTE_DASHBOARD_ACCOUNT,
        params: { profileId: '123' },
      });
    });


    it('should handle errors during save operation', async () => {
      mockFormRef.value.isValid = true;
      
      const mockError = new Error('Save failed');
      mockSetProfileById.mockRejectedValue(mockError);

      await handleSaveStore.handleSave();

      expect(handleSaveStore.isLoading).toBe(false);
    });

    it('should ensure loading is false even if error occurs', async () => {
      mockFormRef.value.isValid = true;
      
      mockSetProfileById.mockRejectedValue(new Error('Save failed'));

      await handleSaveStore.handleSave();

      expect(handleSaveStore.isLoading).toBe(false);
    });
  });

}); 