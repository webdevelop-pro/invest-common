import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/helpers/enums/routes';
import { useFormBusinessController } from '../useFormBusinessController';

const mockFormRef = ref<any>(null);

vi.mock('vue', async () => {
  const vue = await vi.importActual('vue');
  return {
    ...vue,
    useTemplateRef: (name: string) => {
      if (name === 'businessControllerFormChild') {
        return mockFormRef;
      }
      return ref(null);
    },
  };
});

const mockRouterInstance = {
  push: vi.fn(),
  currentRoute: {
    value: {
      query: {},
    },
  },
};

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => mockRouterInstance),
}));

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: vi.fn(() => ({
    selectedUserProfileId: ref('123'),
    selectedUserProfileType: ref('business'),
    selectedUserProfileData: ref({
      data: {
        business_controller: {
          first_name: 'John',
          last_name: 'Controller',
          address1: '123 Test St',
          address2: 'Suite 100',
          city: 'Test City',
          state: 'CA',
          zip_code: '12345',
          country: 'US',
          phone: '555-1234',
          email: 'controller@test.com',
          dob: '1990-01-01',
        },
      },
      user_id: 'user123',
      id: 'profile123',
      escrow_id: null,
    }),
  })),
}));

const repositoryProfilesMockInstance = {
  setProfileById: vi.fn(),
  getProfileById: vi.fn(),
  setProfileByIdState: ref<{ error: Error | null }>({ error: null }),
  getProfileByIdOptionsState: ref({ data: { schema: 'test-schema' } }),
};

const hubspotFormMockInstance = {
  submitFormToHubspot: vi.fn(),
};

vi.mock('InvestCommon/data/profiles/profiles.repository', () => ({
  useRepositoryProfiles: vi.fn(() => repositoryProfilesMockInstance),
}));

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: vi.fn(() => ({
    userSessionTraits: ref({ email: 'user@test.com' }),
  })),
}));

vi.mock('InvestCommon/composable/useHubspotForm', () => ({
  useHubspotForm: vi.fn(() => hubspotFormMockInstance),
}));

vi.mock('UiKit/helpers/validation/general', () => ({
  scrollToError: vi.fn(),
}));

vi.mock('InvestCommon/global', () => ({
  default: {
    HUBSPOT_FORM_ID_BUSINESS_CONTROLLER: 'test-hubspot-form-id',
  },
}));

vi.mock('InvestCommon/types/form', () => ({
  FormChild: vi.fn(),
}));

describe('useFormBusinessController', () => {
  let composable: ReturnType<typeof useFormBusinessController>;
  let mockRouter: any;
  let mockProfilesStore: any;
  let mockSessionStore: any;
  let mockScrollToError: any;

  beforeEach(() => {
    mockRouter = vi.mocked(useRouter)();
    mockProfilesStore = vi.mocked(useProfilesStore)();
    mockSessionStore = vi.mocked(useSessionStore)();
    mockScrollToError = vi.mocked(scrollToError);

    vi.clearAllMocks();

    repositoryProfilesMockInstance.setProfileById.mockReset();
    repositoryProfilesMockInstance.getProfileById.mockReset();
    repositoryProfilesMockInstance.setProfileByIdState.value.error = null;
    repositoryProfilesMockInstance.getProfileByIdOptionsState.value = { data: { schema: 'test-schema' } };
    hubspotFormMockInstance.submitFormToHubspot.mockReset();
    mockFormRef.value = null;

    composable = useFormBusinessController();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct default values', () => {
      expect(composable.backButtonText.value).toBe('Back to Profile Details');
      expect(composable.isLoading.value).toBe(false);
    });

    it('should compute breadcrumbs correctly', () => {
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
          text: 'Business Controller',
        },
      ]);
    });

    it('should compute model data correctly', () => {
      expect(composable.modelData.value).toEqual({
        business_controller: {
          first_name: 'John',
          last_name: 'Controller',
          address1: '123 Test St',
          address2: 'Suite 100',
          city: 'Test City',
          state: 'CA',
          zip_code: '12345',
          country: 'US',
          phone: '555-1234',
          email: 'controller@test.com',
          dob: '1990-01-01',
        },
      });
    });

    it('should compute schema backend correctly', () => {
      expect(composable.schemaBackend.value).toEqual({ schema: 'test-schema' });
    });
  });

  describe('handleSave - Validation failure', () => {
    it('should not proceed when form validation fails', async () => {
      await composable.handleSave();

      expect(mockScrollToError).toHaveBeenCalledWith('ViewDashboardBusinessController');
      expect(repositoryProfilesMockInstance.setProfileById).not.toHaveBeenCalled();
      expect(hubspotFormMockInstance.submitFormToHubspot).not.toHaveBeenCalled();
      expect(repositoryProfilesMockInstance.getProfileById).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should not proceed when form ref is undefined', async () => {
      const newComposable = useFormBusinessController();
      await newComposable.handleSave();

      expect(mockScrollToError).toHaveBeenCalledWith('ViewDashboardBusinessController');
      expect(repositoryProfilesMockInstance.setProfileById).not.toHaveBeenCalled();
    });
  });

  describe('handleSave - Success scenarios', () => {
    beforeEach(() => {
      repositoryProfilesMockInstance.setProfileById.mockResolvedValue(undefined);
      repositoryProfilesMockInstance.getProfileById.mockResolvedValue(undefined);
      repositoryProfilesMockInstance.setProfileByIdState.value.error = null;
    });

    it('should save profile successfully and navigate to account page', async () => {
      const mockForm = {
        onValidate: vi.fn(),
        isValid: true,
        model: {
          business_controller: {
            first_name: 'Updated',
            last_name: 'Controller',
            address1: '456 Updated St',
            city: 'Updated City',
            state: 'NY',
            zip_code: '54321',
            country: 'US',
            phone: '555-5678',
            email: 'updated@controller.com',
            dob: '1985-05-15',
          },
        },
      };

      mockFormRef.value = mockForm;

      const newComposable = useFormBusinessController();
      await newComposable.handleSave();

      expect(repositoryProfilesMockInstance.setProfileById).toHaveBeenCalledWith(
        mockForm.model,
        'business',
        '123',
      );
      expect(hubspotFormMockInstance.submitFormToHubspot).toHaveBeenCalledWith({
        email: 'user@test.com',
        business_controller: mockForm.model,
      });
      expect(repositoryProfilesMockInstance.getProfileById).toHaveBeenCalledWith('business', '123');
      expect(mockRouter.push).toHaveBeenCalledWith({
        name: ROUTE_DASHBOARD_ACCOUNT,
        params: { profileId: '123' },
      });
    });
  });

  describe('handleSave - Error scenarios', () => {
    it('should not proceed with hubspot submission and navigation when setProfileById fails', async () => {
      repositoryProfilesMockInstance.setProfileById.mockRejectedValue(new Error('API Error'));

      const mockForm = {
        onValidate: vi.fn(),
        isValid: true,
        model: {
          business_controller: {
            first_name: 'Test',
            last_name: 'Controller',
            address1: '123 Test St',
            city: 'Test City',
            state: 'CA',
            zip_code: '12345',
            country: 'US',
            phone: '555-1234',
            email: 'test@controller.com',
            dob: '1990-01-01',
          },
        },
      };

      mockFormRef.value = mockForm;

      const newComposable = useFormBusinessController();
      await expect(newComposable.handleSave()).rejects.toThrow('API Error');

      expect(repositoryProfilesMockInstance.setProfileById).toHaveBeenCalled();
      expect(hubspotFormMockInstance.submitFormToHubspot).not.toHaveBeenCalled();
      expect(repositoryProfilesMockInstance.getProfileById).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should not proceed when setProfileByIdState has error', async () => {
      const mockForm = {
        onValidate: vi.fn(),
        isValid: true,
        model: {
          business_controller: {
            first_name: 'Test',
            last_name: 'Controller',
            address1: '123 Test St',
            city: 'Test City',
            state: 'CA',
            zip_code: '12345',
            country: 'US',
            phone: '555-1234',
            email: 'test@controller.com',
            dob: '1990-01-01',
          },
        },
      };

      repositoryProfilesMockInstance.setProfileById.mockClear();

      repositoryProfilesMockInstance.setProfileById.mockImplementation(() => {
        repositoryProfilesMockInstance.setProfileByIdState.value.error = new Error('Validation Error');
        return Promise.resolve();
      });

      mockFormRef.value = mockForm;

      const newComposable = useFormBusinessController();

      expect(mockFormRef.value).toStrictEqual(mockForm);
      expect(mockForm.isValid).toBe(true);

      expect(repositoryProfilesMockInstance.setProfileById).toBeDefined();

      await newComposable.handleSave();

      expect(repositoryProfilesMockInstance.setProfileById).toHaveBeenCalled();
      expect(hubspotFormMockInstance.submitFormToHubspot).not.toHaveBeenCalled();
      expect(repositoryProfilesMockInstance.getProfileById).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should set loading state correctly during save operation', async () => {
      const mockForm = {
        onValidate: vi.fn(),
        isValid: true,
        model: {
          business_controller: {
            first_name: 'Test',
            last_name: 'Controller',
            address1: '123 Test St',
            city: 'Test City',
            state: 'CA',
            zip_code: '12345',
            country: 'US',
            phone: '555-1234',
            email: 'test@controller.com',
            dob: '1990-01-01',
          },
        },
      };

      mockFormRef.value = mockForm;

      const newComposable = useFormBusinessController();

      const savePromise = newComposable.handleSave();

      expect(newComposable.isLoading.value).toBe(true);

      await savePromise;

      expect(newComposable.isLoading.value).toBe(false);
    });

    it('should set loading to false even when error occurs', async () => {
      repositoryProfilesMockInstance.setProfileById.mockRejectedValue(new Error('API Error'));

      const mockForm = {
        onValidate: vi.fn(),
        isValid: true,
        model: {
          business_controller: {
            first_name: 'Test',
            last_name: 'Controller',
            address1: '123 Test St',
            city: 'Test City',
            state: 'CA',
            zip_code: '12345',
            country: 'US',
            phone: '555-1234',
            email: 'test@controller.com',
            dob: '1990-01-01',
          },
        },
      };

      mockFormRef.value = mockForm;

      const newComposable = useFormBusinessController();

      await expect(newComposable.handleSave()).rejects.toThrow('API Error');

      expect(newComposable.isLoading.value).toBe(false);
    });

    it('should handle network errors gracefully', async () => {
      repositoryProfilesMockInstance.setProfileById.mockRejectedValue(new Error('Network Error'));

      const mockForm = {
        onValidate: vi.fn(),
        isValid: true,
        model: {
          business_controller: {
            first_name: 'Test',
            last_name: 'Controller',
            address1: '123 Test St',
            city: 'Test City',
            state: 'CA',
            zip_code: '12345',
            country: 'US',
            phone: '555-1234',
            email: 'test@controller.com',
            dob: '1990-01-01',
          },
        },
      };

      mockFormRef.value = mockForm;

      const newComposable = useFormBusinessController();

      await expect(newComposable.handleSave()).rejects.toThrow('Network Error');
      expect(newComposable.isLoading.value).toBe(false);
    });
  });

  describe('Return values', () => {
    it('should return all expected properties', () => {
      const returnedComposable = useFormBusinessController();

      expect(returnedComposable).toHaveProperty('backButtonText');
      expect(returnedComposable).toHaveProperty('breadcrumbs');
      expect(returnedComposable).toHaveProperty('isDisabledButton');
      expect(returnedComposable).toHaveProperty('isLoading');
      expect(returnedComposable).toHaveProperty('handleSave');
      expect(returnedComposable).toHaveProperty('modelData');
      expect(returnedComposable).toHaveProperty('schemaBackend');
      expect(returnedComposable).toHaveProperty('errorData');
    });
  });

  describe('Form validation integration', () => {
    it('should call form validation before proceeding with save', async () => {
      const mockForm = {
        onValidate: vi.fn(),
        isValid: true,
        model: {
          business_controller: {
            first_name: 'Test',
            last_name: 'Controller',
            address1: '123 Test St',
            city: 'Test City',
            state: 'CA',
            zip_code: '12345',
            country: 'US',
            phone: '555-1234',
            email: 'test@controller.com',
            dob: '1990-01-01',
          },
        },
      };

      mockFormRef.value = mockForm;

      const newComposable = useFormBusinessController();
      await newComposable.handleSave();

      expect(mockForm.onValidate).toHaveBeenCalled();
    });

    it('should not proceed with save when form validation fails', async () => {
      const mockForm = {
        onValidate: vi.fn(),
        isValid: false,
        model: {
          business_controller: {
            first_name: 'Test',
            last_name: 'Controller',
            address1: '123 Test St',
            city: 'Test City',
            state: 'CA',
            zip_code: '12345',
            country: 'US',
            phone: '555-1234',
            email: 'test@controller.com',
            dob: '1990-01-01',
          },
        },
      };

      mockFormRef.value = mockForm;

      const newComposable = useFormBusinessController();
      await newComposable.handleSave();

      expect(mockForm.onValidate).toHaveBeenCalled();
      expect(repositoryProfilesMockInstance.setProfileById).not.toHaveBeenCalled();
      expect(mockScrollToError).toHaveBeenCalledWith('ViewDashboardBusinessController');
    });
  });
});
