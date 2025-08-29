import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useHubspotForm } from 'UiKit/composables/useHubspotForm';
import { useFormPlanInformation } from '../useFormPlanInformation';

const mockFormRef = ref<any>(null);

vi.mock('vue', async () => {
  const vue = await vi.importActual('vue');
  return {
    ...vue,
    useTemplateRef: vi.fn((name: string) => {
      if (name === 'planInformationFormChild') {
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
  useProfilesStore: vi.fn(),
}));

vi.mock('InvestCommon/data/profiles/profiles.repository', () => ({
  useRepositoryProfiles: vi.fn(),
}));

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: vi.fn(),
}));

vi.mock('UiKit/composables/useHubspotForm', () => ({
  useHubspotForm: vi.fn(),
}));

vi.mock('InvestCommon/global', () => ({
  default: {
    HUBSPOT_FORM_ID_PLAN_INFO: 'test-hubspot-form-id',
  },
}));

vi.mock('InvestCommon/helpers/enums/routes', () => ({
  ROUTE_DASHBOARD_ACCOUNT: 'ROUTE_DASHBOARD_ACCOUNT',
}));

vi.mock('UiKit/helpers/validation/general', () => ({
  scrollToError: vi.fn(),
}));

describe('useFormPlanInformation', () => {
  let composable: ReturnType<typeof useFormPlanInformation>;
  let mockProfilesStore: any;
  let mockRepositoryProfiles: any;
  let mockSessionStore: any;
  let mockHubspotForm: any;

  beforeEach(() => {
    setActivePinia(createPinia());

    mockFormRef.value = {
      isValid: true,
      model: {
        investment_objectives: {
          duration: '1 to 3 years',
          objectives: 'Growth',
          risk_comfort: 'High Risk',
          years_experience: 5,
          importance_of_access: 'Very Important',
        },
        risk_involved: true,
        resell_difficulties: false,
        educational_materials: true,
        cancelation_restrictions: true,
        no_legal_advices_from_company: true,
      },
      onValidate: vi.fn(),
    };

    mockProfilesStore = {
      selectedUserProfileId: ref('123'),
      selectedUserProfileType: ref('individual'),
      selectedUserProfileData: ref({
        data: {
          investment_objectives: {
            duration: '1 to 3 years',
            objectives: 'Growth',
            risk_comfort: 'High Risk',
            years_experience: 5,
            importance_of_access: 'Very Important',
          },
          risk_involved: true,
          resell_difficulties: false,
          educational_materials: true,
          cancelation_restrictions: true,
          no_legal_advices_from_company: true,
        },
      }),
    };

    mockRepositoryProfiles = {
      setProfileByIdState: ref({ error: null }),
      getProfileByIdOptionsState: ref({ data: { schema: {} } }),
      setProfileById: vi.fn().mockResolvedValue({}),
      getProfileById: vi.fn().mockResolvedValue({}),
    };

    mockSessionStore = {
      userSessionTraits: ref({ email: 'test@example.com' }),
    };

    mockHubspotForm = {
      submitFormToHubspot: vi.fn(),
    };

    vi.mocked(useProfilesStore).mockReturnValue(mockProfilesStore);
    vi.mocked(useRepositoryProfiles).mockReturnValue(mockRepositoryProfiles);
    vi.mocked(useSessionStore).mockReturnValue(mockSessionStore);
    vi.mocked(useHubspotForm).mockReturnValue(mockHubspotForm);

    composable = useFormPlanInformation();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with correct default values', () => {
      expect(composable.backButtonText.value).toBe('Back to Profile Details');
      expect(composable.isLoading.value).toBe(false);
      expect(composable.isDisabledButton.value).toBe(false);
    });

    it('should compute breadcrumbs correctly', () => {
      const expectedBreadcrumbs = [
        {
          text: 'Dashboard',
          to: { name: 'ROUTE_DASHBOARD_ACCOUNT', params: { profileId: '123' } },
        },
        {
          text: 'Profile Details',
          to: { name: 'ROUTE_DASHBOARD_ACCOUNT', params: { profileId: '123' } },
        },
        {
          text: 'Plan Information',
        },
      ];

      expect(composable.breadcrumbs.value).toEqual(expectedBreadcrumbs);
    });

    it('should return model data from selected user profile', () => {
      expect(composable.modelData.value).toEqual(mockProfilesStore.selectedUserProfileData.value.data);
    });
  });

  describe('handleSave - success flow', () => {
    it('should save plan information successfully', async () => {
      mockFormRef.value.isValid = true;
      mockFormRef.value.onValidate = vi.fn();

      await composable.handleSave();

      expect(mockFormRef.value.onValidate).toHaveBeenCalled();
      expect(mockRepositoryProfiles.setProfileById).toHaveBeenCalledWith(
        mockFormRef.value.model,
        'individual',
        '123',
      );
      expect(mockHubspotForm.submitFormToHubspot).toHaveBeenCalledWith({
        email: 'test@example.com',
        ...mockFormRef.value.model,
      });
      expect(mockRepositoryProfiles.getProfileById).toHaveBeenCalledWith('individual', '123');
      expect(mockRouter.push).toHaveBeenCalledWith({
        name: 'ROUTE_DASHBOARD_ACCOUNT',
        params: { profileId: '123' },
      });
    });

    it('should set loading state during save operation', async () => {
      mockFormRef.value.isValid = true;
      mockRepositoryProfiles.setProfileById = vi.fn().mockImplementation(() => {
        expect(composable.isLoading.value).toBe(true);
        return Promise.resolve({});
      });

      await composable.handleSave();

      expect(composable.isLoading.value).toBe(false);
    });

    it('should handle loading state in finally block', async () => {
      mockFormRef.value.isValid = true;
      mockRepositoryProfiles.setProfileById = vi.fn().mockRejectedValue(new Error('API Error'));

      await expect(composable.handleSave()).rejects.toThrow('API Error');
      expect(composable.isLoading.value).toBe(false);
    });
  });

  describe('handleSave - validation error flow', () => {
    it('should not save when form is invalid', async () => {
      mockFormRef.value.isValid = false;
      mockFormRef.value.onValidate = vi.fn();

      await composable.handleSave();

      expect(mockFormRef.value.onValidate).toHaveBeenCalled();
      expect(mockRepositoryProfiles.setProfileById).not.toHaveBeenCalled();
      expect(mockHubspotForm.submitFormToHubspot).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should return early when validation fails', async () => {
      mockFormRef.value.isValid = false;
      mockFormRef.value.onValidate = vi.fn();

      await composable.handleSave();

      expect(mockRepositoryProfiles.setProfileById).not.toHaveBeenCalled();
      expect(mockHubspotForm.submitFormToHubspot).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe('handleSave - API error flow', () => {
    it('should handle API errors gracefully', async () => {
      mockFormRef.value.isValid = true;
      const apiError = new Error('API Error');
      mockRepositoryProfiles.setProfileById = vi.fn().mockRejectedValue(apiError);

      await expect(composable.handleSave()).rejects.toThrow('API Error');

      expect(mockFormRef.value.onValidate).toHaveBeenCalled();
      expect(mockRepositoryProfiles.setProfileById).toHaveBeenCalled();
      expect(mockHubspotForm.submitFormToHubspot).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
      expect(composable.isLoading.value).toBe(false);
    });

    it('should not submit to HubSpot when API fails', async () => {
      mockFormRef.value.isValid = true;
      mockRepositoryProfiles.setProfileById = vi.fn().mockRejectedValue(new Error('API Error'));

      await expect(composable.handleSave()).rejects.toThrow('API Error');

      expect(mockHubspotForm.submitFormToHubspot).not.toHaveBeenCalled();
    });

    it('should not navigate when API fails', async () => {
      mockFormRef.value.isValid = true;
      mockRepositoryProfiles.setProfileById = vi.fn().mockRejectedValue(new Error('API Error'));

      await expect(composable.handleSave()).rejects.toThrow('API Error');

      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe('navigation', () => {
    it('should navigate to account page after successful save', async () => {
      mockFormRef.value.isValid = true;

      await composable.handleSave();

      expect(mockRouter.push).toHaveBeenCalledWith({
        name: 'ROUTE_DASHBOARD_ACCOUNT',
        params: { profileId: '123' },
      });
    });
  });

  describe('data refresh', () => {
    it('should refresh profile data after successful save', async () => {
      mockFormRef.value.isValid = true;

      await composable.handleSave();

      expect(mockRepositoryProfiles.getProfileById).toHaveBeenCalledWith('individual', '123');
    });

    it('should use correct profile type and ID for refresh', async () => {
      mockFormRef.value.isValid = true;
      mockProfilesStore.selectedUserProfileType.value = 'business';
      mockProfilesStore.selectedUserProfileId.value = '789';

      await composable.handleSave();

      expect(mockRepositoryProfiles.getProfileById).toHaveBeenCalledWith('business', '789');
    });
  });

  describe('computed properties', () => {
    it('should compute errorData from setProfileByIdState', () => {
      mockRepositoryProfiles.setProfileByIdState.value = { 
        error: { data: { responseJson: 'test error' } } 
      };

      expect(composable.errorData.value).toBe('test error');
    });

    it('should compute schemaBackend from getProfileByIdOptionsState', () => {
      mockRepositoryProfiles.getProfileByIdOptionsState.value = { 
        data: { schema: { test: 'schema' } } 
      };

      expect(composable.schemaBackend.value).toEqual({ schema: { test: 'schema' } });
    });
  });
});
