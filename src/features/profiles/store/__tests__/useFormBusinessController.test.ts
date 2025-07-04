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
import { scrollToError } from 'UiKit/helpers/validation/general';
import { ROUTE_DASHBOARD_ACCOUNT } from '../../../../helpers/enums/routes';
import { useFormBusinessController } from '../useFormBusinessController';

// Mock useTemplateRef at module level
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

vi.mock('InvestCommon/data/profiles/profiles.repository', () => ({
  useRepositoryProfiles: vi.fn(() => ({
    setProfileById: vi.fn(),
    getProfileById: vi.fn(),
    setProfileByIdState: ref({ error: null }),
    getProfileByIdOptionsState: ref({ data: { schema: 'test-schema' } }),
  })),
}));

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: vi.fn(() => ({
    userSessionTraits: ref({ email: 'user@test.com' }),
  })),
}));

vi.mock('InvestCommon/composable/useHubspotForm', () => ({
  useHubspotForm: vi.fn(() => ({
    submitFormToHubspot: vi.fn(),
  })),
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
  let store: ReturnType<typeof useFormBusinessController>;
  let mockRouter: any;
  let mockProfilesStore: any;
  let mockRepositoryProfiles: any;
  let mockSessionStore: any;
  let mockHubspotForm: any;
  let mockScrollToError: any;

  beforeEach(() => {
    setActivePinia(createPinia());

    mockRouter = vi.mocked(useRouter)();
    mockProfilesStore = vi.mocked(useProfilesStore)();
    mockRepositoryProfiles = vi.mocked(useRepositoryProfiles)();
    mockSessionStore = vi.mocked(useSessionStore)();
    mockHubspotForm = vi.mocked(useHubspotForm)('test-hubspot-form-id');
    mockScrollToError = vi.mocked(scrollToError);

    vi.clearAllMocks();
    
    // Reset mock form ref
    mockFormRef.value = null;

    store = useFormBusinessController();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct default values', () => {
      expect(store.backButtonText).toBe('Back to Profile Details');
      expect(store.isLoading).toBe(false);
    });

    it('should compute breadcrumbs correctly', () => {
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
          text: 'Business Controller',
        },
      ]);
    });

    it('should compute model data correctly', () => {
      expect(store.modelData).toEqual({
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
      expect(store.schemaBackend).toEqual({ schema: 'test-schema' });
    });
  });

  describe('handleSave - Validation failure', () => {
    it('should not proceed when form validation fails', async () => {
      await store.handleSave();

      expect(mockScrollToError).toHaveBeenCalledWith('ViewDashboardBusinessController');
      expect(mockRepositoryProfiles.setProfileById).not.toHaveBeenCalled();
      expect(mockHubspotForm.submitFormToHubspot).not.toHaveBeenCalled();
      expect(mockRepositoryProfiles.getProfileById).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should not proceed when form ref is undefined', async () => {
      const newStore = useFormBusinessController();
      await newStore.handleSave();

      expect(mockScrollToError).toHaveBeenCalledWith('ViewDashboardBusinessController');
      expect(mockRepositoryProfiles.setProfileById).not.toHaveBeenCalled();
    });
  });

  describe('handleSave - Success scenarios', () => {
    beforeEach(() => {
      mockRepositoryProfiles.setProfileById.mockResolvedValue(undefined);
      mockRepositoryProfiles.getProfileById.mockResolvedValue(undefined);
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

      const newStore = useFormBusinessController();
      await newStore.handleSave();

      expect(mockRepositoryProfiles.setProfileById).toHaveBeenCalledWith(
        mockForm.model,
        'business',
        '123',
      );
      expect(mockHubspotForm.submitFormToHubspot).toHaveBeenCalledWith({
        email: 'user@test.com',
        business_controller: mockForm.model,
      });
      expect(mockRepositoryProfiles.getProfileById).toHaveBeenCalledWith('business', '123');
      expect(mockRouter.push).toHaveBeenCalledWith({
        name: ROUTE_DASHBOARD_ACCOUNT,
        params: { profileId: '123' },
      });
    });
  });

  describe('handleSave - Error scenarios', () => {
    it('should not proceed with hubspot submission and navigation when setProfileById fails', async () => {
      mockRepositoryProfiles.setProfileById.mockRejectedValue(new Error('API Error'));

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

      const newStore = useFormBusinessController();
      await newStore.handleSave();

      expect(mockRepositoryProfiles.setProfileById).toHaveBeenCalled();
      expect(mockHubspotForm.submitFormToHubspot).not.toHaveBeenCalled();
      expect(mockRepositoryProfiles.getProfileById).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should not proceed when setProfileByIdState has error', async () => {
      // Mock setProfileById to set the error state after being called
      mockRepositoryProfiles.setProfileById.mockImplementation(() => {
        mockRepositoryProfiles.setProfileByIdState.value.error = 'Validation Error';
        return Promise.resolve();
      });

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

      // Create a new store after setting the mock form ref
      const newStore = useFormBusinessController();
      
      await newStore.handleSave();

      // setProfileById should be called, but subsequent actions should be prevented
      expect(mockRepositoryProfiles.setProfileById).toHaveBeenCalled();
      expect(mockHubspotForm.submitFormToHubspot).not.toHaveBeenCalled();
      expect(mockRepositoryProfiles.getProfileById).not.toHaveBeenCalled();
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

      const newStore = useFormBusinessController();
      
      // Start the save operation
      const savePromise = newStore.handleSave();
      
      // Check loading state during operation
      expect(newStore.isLoading).toBe(true);
      
      await savePromise;
      
      // Check loading state after operation
      expect(newStore.isLoading).toBe(false);
    });

    it('should set loading to false even when error occurs', async () => {
      mockRepositoryProfiles.setProfileById.mockRejectedValue(new Error('API Error'));

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

      const newStore = useFormBusinessController();
      
      await newStore.handleSave();

      expect(newStore.isLoading).toBe(false);
    });

    it('should handle network errors gracefully', async () => {
      mockRepositoryProfiles.setProfileById.mockRejectedValue(new Error('Network Error'));

      const mockForm = {
        value: {
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
        },
      };

      mockFormRef.value = mockForm;

      const newStore = useFormBusinessController();
      
      await expect(newStore.handleSave()).resolves.not.toThrow();
      expect(newStore.isLoading).toBe(false);
    });
  });

  describe('Return values', () => {
    it('should return all expected properties', () => {
      const returnedStore = useFormBusinessController();

      expect(returnedStore).toHaveProperty('backButtonText');
      expect(returnedStore).toHaveProperty('breadcrumbs');
      expect(returnedStore).toHaveProperty('isDisabledButton');
      expect(returnedStore).toHaveProperty('isLoading');
      expect(returnedStore).toHaveProperty('handleSave');
      expect(returnedStore).toHaveProperty('modelData');
      expect(returnedStore).toHaveProperty('schemaBackend');
      expect(returnedStore).toHaveProperty('errorData');
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

      const newStore = useFormBusinessController();
      await newStore.handleSave();

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

      const newStore = useFormBusinessController();
      await newStore.handleSave();

      expect(mockForm.onValidate).toHaveBeenCalled();
      expect(mockRepositoryProfiles.setProfileById).not.toHaveBeenCalled();
      expect(mockScrollToError).toHaveBeenCalledWith('ViewDashboardBusinessController');
    });
  });
}); 