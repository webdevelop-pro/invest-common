import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { ref } from 'vue';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/domain/config/enums/routes';
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

const mockSetProfileById = vi.fn().mockResolvedValue(undefined);
const mockGetProfileById = vi.fn().mockResolvedValue(undefined);
const mockSubmitFormToHubspot = vi.fn();

vi.mock('InvestCommon/data/profiles/profiles.repository', () => ({
  useRepositoryProfiles: vi.fn(() => ({
    setProfileById: mockSetProfileById,
    getProfileById: mockGetProfileById,
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

vi.mock('UiKit/composables/useHubspotForm', () => ({
  useHubspotForm: vi.fn(() => ({
    submitFormToHubspot: mockSubmitFormToHubspot,
  })),
}));

vi.mock('UiKit/helpers/validation/general', () => ({
  scrollToError: vi.fn(),
}));

vi.mock('InvestCommon/domain/config/env', () => ({
  default: {
    HUBSPOT_FORM_ID_TRUST_INFORMATION: 'trust-info-form-id',
  },
}));

describe('useFormTrustInformation', () => {
  let composable: ReturnType<typeof useFormTrustInformation>;

  beforeEach(() => {
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
    mockSetProfileById.mockResolvedValue(undefined);
    mockGetProfileById.mockResolvedValue(undefined);
    mockSubmitFormToHubspot.mockClear();

    composable = useFormTrustInformation();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      expect(composable.backButtonText.value).toBe('Back to Profile Details');
      expect(composable.isLoading.value).toBe(false);
      expect(composable.isDisabledButton.value).toBe(false);
    });

    it('should have correct breadcrumbs', () => {
      expect(composable.breadcrumbs.value).toEqual([
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
      expect(composable.modelData.value).toEqual({
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
    let handleSaveComposable: any;

    beforeEach(() => {
      handleSaveComposable = useFormTrustInformation();
    });

    it('should validate form before saving', async () => {
      mockFormRef.value.isValid = true;

      await handleSaveComposable.handleSave();

      expect(mockFormRef.value.onValidate).toHaveBeenCalled();
    });

    it('should not save when form is invalid', async () => {
      mockFormRef.value.isValid = false;

      await handleSaveComposable.handleSave();

      expect(mockSetProfileById).not.toHaveBeenCalled();
    });

    it('should save form data when valid', async () => {
      mockFormRef.value.isValid = true;

      await composable.handleSave();

      expect(mockSetProfileById).toHaveBeenCalledWith(
        {
          trust_name: 'Test Trust',
          trust_address: '123 Trust St',
          trust_city: 'Trust City',
          trust_state: 'TS',
          trust_zip: '12345',
          trust_country: 'US',
        },
        'individual',
        '123',
      );
    });

    it('should submit form to Hubspot after successful save', async () => {
      mockFormRef.value.isValid = true;

      await handleSaveComposable.handleSave();

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

      await handleSaveComposable.handleSave();

      expect(mockGetProfileById).toHaveBeenCalledWith('individual', '123');
    });

    it('should navigate to account page after successful save', async () => {
      mockFormRef.value.isValid = true;

      await handleSaveComposable.handleSave();

      expect(mockPush).toHaveBeenCalledWith({
        name: ROUTE_DASHBOARD_ACCOUNT,
        params: { profileId: '123' },
      });
    });

    it('should handle errors during save operation', async () => {
      mockFormRef.value.isValid = true;

      const mockError = new Error('Save failed');
      mockSetProfileById.mockRejectedValue(mockError);

      try {
        await handleSaveComposable.handleSave();
      } catch (error) {
        // Expected error
      }

      expect(handleSaveComposable.isLoading.value).toBe(false);
    });

    it('should ensure loading is false even if error occurs', async () => {
      mockFormRef.value.isValid = true;

      mockSetProfileById.mockRejectedValue(new Error('Save failed'));

      try {
        await handleSaveComposable.handleSave();
      } catch (error) {
        // Expected error
      }

      expect(handleSaveComposable.isLoading.value).toBe(false);
    });
  });
});
