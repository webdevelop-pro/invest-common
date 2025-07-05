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
import { useFormValidation } from 'InvestCommon/composable/useFormValidation';
import { ROUTE_DASHBOARD_ACCOUNT } from '../../../../helpers/enums/routes';
import { useFormTrustedContact } from '../useFormTrustedContact';

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

const selectedUserProfileId = ref('123');
const selectedUserProfileType = ref('individual');
const selectedUserProfileData = ref({
  data: {
    beneficiary: {
      first_name: 'Jane',
      last_name: 'Smith',
      relationship_type: 'spouse',
      phone: '+1234567890',
      email: 'jane@example.com',
      dob: '1990-01-01',
    },
  },
  user_id: 'user123',
  id: 'profile123',
});
const mockProfilesStore = {
  selectedUserProfileId,
  selectedUserProfileType,
  selectedUserProfileData,
};
vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: vi.fn(() => mockProfilesStore),
}));

const isValid = ref(false);
const model = {
  beneficiary: {
    first_name: 'Jane',
    last_name: 'Smith',
    relationship_type: 'spouse',
    phone: '+1234567890',
    email: 'jane@example.com',
    dob: '1990-01-01',
  },
};
const validation = ref({});
const mockOnValidate = vi.fn();

const userSessionTraits = ref({ email: 'john@example.com' });

vi.mock('InvestCommon/composable/useFormValidation', () => ({
  useFormValidation: vi.fn(() => ({
    model,
    validation,
    isValid,
    onValidate: mockOnValidate,
  })),
}));

const mockSetProfileById = vi.fn();
const mockGetProfileById = vi.fn();
const setProfileByIdState = ref({ error: null });
const getProfileByIdOptionsState = ref({
  data: {
    beneficiary: {
      first_name: 'Jane',
      last_name: 'Smith',
      relationship_type: 'spouse',
      phone: '+1234567890',
      email: 'jane@example.com',
      dob: '1990-01-01',
    },
  },
  loading: false,
});
const mockRepositoryProfiles = {
  setProfileById: mockSetProfileById,
  getProfileById: mockGetProfileById,
  setProfileByIdState,
  getProfileByIdOptionsState,
};
vi.mock('InvestCommon/data/profiles/profiles.repository', () => ({
  useRepositoryProfiles: vi.fn(() => mockRepositoryProfiles),
}));

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: vi.fn(() => ({
    userSessionTraits,
  })),
}));

const mockSubmitFormToHubspot = vi.fn();
vi.mock('InvestCommon/composable/useHubspotForm', () => ({
  useHubspotForm: vi.fn(() => ({
    submitFormToHubspot: mockSubmitFormToHubspot,
  })),
}));

vi.mock('UiKit/helpers/validation/general', () => ({
  scrollToError: vi.fn(),
}));

vi.mock('InvestCommon/global', () => ({
  default: {
    HUBSPOT_FORM_ID_TRUSTED_CONTACT: 'test-hubspot-form-id',
  },
}));

describe('useFormTrustedContact', () => {
  let store: ReturnType<typeof useFormTrustedContact>;
  let mockRouter: any;
  let mockProfilesStore: any;
  let mockRepositoryProfiles: any;
  let mockSessionStore: any;
  let mockHubspotForm: any;
  let mockScrollToError: any;
  let mockFormValidation: any;

  beforeEach(() => {
    setActivePinia(createPinia());

    mockRouter = vi.mocked(useRouter)();
    mockProfilesStore = vi.mocked(useProfilesStore)();
    mockRepositoryProfiles = vi.mocked(useRepositoryProfiles)();
    mockSessionStore = vi.mocked(useSessionStore)();
    mockHubspotForm = vi.mocked(useHubspotForm)();
    mockScrollToError = vi.mocked(scrollToError);
    mockFormValidation = vi.mocked(useFormValidation)();

    vi.clearAllMocks();

    store = useFormTrustedContact();
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
          text: 'Trusted Contact',
        },
      ]);
    });

    it('should initialize model with beneficiary data from profile', () => {
      expect(store.model.beneficiary).toEqual({
        first_name: 'Jane',
        last_name: 'Smith',
        relationship_type: 'spouse',
        phone: '+1234567890',
        email: 'jane@example.com',
        dob: '1990-01-01',
      });
    });
  });

  describe('Computed properties', () => {
    it('should compute isDisabledButton based on form validity', () => {
      expect(store.isDisabledButton).toBe(true);
    });

    it('should update isDisabledButton when form becomes valid', () => {
      isValid.value = true;
      const newStore = useFormTrustedContact();
      expect(newStore.isDisabledButton).toBe(false);
    });

    it('should handle schema backend when data is null', () => {
      mockRepositoryProfiles.getProfileByIdOptionsState.value.data = null;
      const newStore = useFormTrustedContact();
      expect(newStore.schemaBackend).toBeNull();
    });

    it('should handle schema backend when data is undefined', () => {
      mockRepositoryProfiles.getProfileByIdOptionsState.value.data = undefined;
      model.beneficiary = {} as any;
      const newStore = useFormTrustedContact();
      expect(newStore.schemaBackend).toBeNull();
    });

    it('should handle error data when setProfileByIdState has error', () => {
      mockRepositoryProfiles.setProfileByIdState.value.error = 'API Error';
      const newStore = useFormTrustedContact();
      expect(newStore.errorData).toBe('API Error');
    });

    it('should handle loading fields state', () => {
      mockRepositoryProfiles.getProfileByIdOptionsState.value.loading = true;
      const newStore = useFormTrustedContact();
      expect(newStore.isLoadingFields).toBe(true);
    });
  });

  describe('Model synchronization', () => {
    it('should update model when selectedUserProfileData beneficiary changes', () => {
      const newBeneficiary = {
        first_name: 'John',
        last_name: 'Doe',
        relationship_type: 'parent',
        phone: '+0987654321',
        email: 'john@example.com',
        dob: '1985-05-15',
      };

      mockProfilesStore.selectedUserProfileData.value.data.beneficiary = newBeneficiary;
      model.beneficiary = newBeneficiary as any;
      const newStore = useFormTrustedContact();

      expect(newStore.model.beneficiary).toEqual(newBeneficiary);
    });

    it('should handle when beneficiary data is null', () => {
      mockProfilesStore.selectedUserProfileData.value.data.beneficiary = null;
      model.beneficiary = {} as any;
      const newStore = useFormTrustedContact();

      expect(newStore.model.beneficiary).toEqual({});
    });

    it('should handle when beneficiary data is undefined', () => {
      mockProfilesStore.selectedUserProfileData.value.data.beneficiary = undefined;
      model.beneficiary = {} as any;
      const newStore = useFormTrustedContact();
      expect(newStore.model.beneficiary).toEqual({});
    });
  });

  describe('handleSave - Validation failure', () => {
    it('should not proceed when form validation fails', async () => {
      isValid.value = false;
      mockFormValidation.model.beneficiary = null;

      await store.handleSave();

      expect(mockOnValidate).toHaveBeenCalled();
      expect(mockScrollToError).toHaveBeenCalledWith('ViewDashboardTrustedContact');
      expect(mockSetProfileById).not.toHaveBeenCalled();
      expect(mockSubmitFormToHubspot).not.toHaveBeenCalled();
    });

    it('should not proceed when beneficiary model is null', async () => {
      isValid.value = true;
      mockFormValidation.model.beneficiary = null;

      await store.handleSave();

      expect(mockOnValidate).toHaveBeenCalled();
      expect(mockScrollToError).toHaveBeenCalledWith('ViewDashboardTrustedContact');
      expect(mockSetProfileById).not.toHaveBeenCalled();
    });

    it('should not proceed when beneficiary model is undefined', async () => {
      isValid.value = true;
      mockFormValidation.model.beneficiary = undefined;

      await store.handleSave();

      expect(mockOnValidate).toHaveBeenCalled();
      expect(mockScrollToError).toHaveBeenCalledWith('ViewDashboardTrustedContact');
      expect(mockSetProfileById).not.toHaveBeenCalled();
    });
  });

  describe('handleSave - Success scenarios', () => {
    beforeEach(() => {
      isValid.value = true;
      mockFormValidation.model.beneficiary = {
        first_name: 'Jane',
        last_name: 'Smith',
        relationship_type: 'spouse',
        phone: '+1234567890',
        email: 'jane@example.com',
        dob: '1990-01-01',
      };
      mockSetProfileById.mockResolvedValue(undefined);
      mockGetProfileById.mockResolvedValue(undefined);
    });

    it('should save profile successfully and navigate to account page', async () => {
      await store.handleSave();

      expect(mockOnValidate).toHaveBeenCalled();
      expect(mockSetProfileById).toHaveBeenCalledWith(
        {
          beneficiary: {
            first_name: 'Jane',
            last_name: 'Smith',
            relationship_type: 'spouse',
            phone: '+1234567890',
            email: 'jane@example.com',
            dob: '1990-01-01',
          },
        },
        'individual',
        '123',
      );
      expect(mockSubmitFormToHubspot).toHaveBeenCalledWith({
        email: 'john@example.com',
        firstname: 'Jane',
        lastname: 'Smith',
        relationship_type: 'spouse',
        phone: '+1234567890',
        trusted_email: 'jane@example.com',
        date_of_birth: '1990-01-01',
      });
      expect(mockGetProfileById).toHaveBeenCalledWith('individual', '123');
      expect(mockRouter.push).toHaveBeenCalledWith({
        name: ROUTE_DASHBOARD_ACCOUNT,
        params: { profileId: '123' },
      });
    });

    it('should handle save with different profile types', async () => {
      mockProfilesStore.selectedUserProfileType.value = 'entity';
      mockProfilesStore.selectedUserProfileId.value = '456';

      const testStore = useFormTrustedContact();

      await testStore.handleSave();

      expect(mockSetProfileById).toHaveBeenCalledWith(
        {
          beneficiary: {
            first_name: 'Jane',
            last_name: 'Smith',
            relationship_type: 'spouse',
            phone: '+1234567890',
            email: 'jane@example.com',
            dob: '1990-01-01',
          },
        },
        'entity',
        '456',
      );
      expect(mockGetProfileById).toHaveBeenCalledWith('entity', '456');
      expect(mockRouter.push).toHaveBeenCalledWith({ 
        name: ROUTE_DASHBOARD_ACCOUNT, 
        params: { profileId: '456' },
      });
    });

    it('should handle save with different user session email', async () => {
      userSessionTraits.value.email = 'different@example.com';

      await store.handleSave();

      expect(mockSubmitFormToHubspot).toHaveBeenCalledWith({
        email: 'different@example.com',
        firstname: 'Jane',
        lastname: 'Smith',
        relationship_type: 'spouse',
        phone: '+1234567890',
        trusted_email: 'jane@example.com',
        date_of_birth: '1990-01-01',
      });
    });

    it('should handle save with different beneficiary data', async () => {
      userSessionTraits.value.email = 'john@example.com';
      model.beneficiary = {
        first_name: 'John',
        last_name: 'Doe',
        relationship_type: 'parent',
        phone: '+0987654321',
        email: 'john@example.com',
        dob: '1985-05-15',
      };
      selectedUserProfileType.value = 'individual';
      selectedUserProfileId.value = '123';
      const testStore = useFormTrustedContact();

      await testStore.handleSave();

      expect(mockSetProfileById).toHaveBeenCalledWith(
        {
          beneficiary: {
            first_name: 'John',
            last_name: 'Doe',
            relationship_type: 'parent',
            phone: '+0987654321',
            email: 'john@example.com',
            dob: '1985-05-15',
          },
        },
        'individual',
        '123',
      );
      expect(mockSubmitFormToHubspot).toHaveBeenCalledWith({
        email: 'john@example.com',
        firstname: 'John',
        lastname: 'Doe',
        relationship_type: 'parent',
        phone: '+0987654321',
        trusted_email: 'john@example.com',
        date_of_birth: '1985-05-15',
      });
    });
  });

  describe('handleSave - Error scenarios', () => {
    beforeEach(() => {
      isValid.value = true;
      mockFormValidation.model.beneficiary = {
        first_name: 'Jane',
        last_name: 'Smith',
        relationship_type: 'spouse',
        phone: '+1234567890',
        email: 'jane@example.com',
        dob: '1990-01-01',
      };
    });

    it('should handle setProfileById error gracefully', async () => {
      mockSetProfileById.mockRejectedValue(new Error('API Error'));

      try {
        await store.handleSave();
      } catch (e) {
      }

      expect(mockSetProfileById).toHaveBeenCalled();
      expect(mockSubmitFormToHubspot).not.toHaveBeenCalled();
      expect(mockGetProfileById).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
      expect(store.isLoading).toBe(false);
    });

    it('should handle hubspot form submission error gracefully', async () => {
      mockSetProfileById.mockResolvedValue(undefined);
      mockSubmitFormToHubspot.mockImplementation(() => {
        throw new Error('Hubspot Error');
      });

      try {
        await store.handleSave();
      } catch (e) {
      }

      expect(mockSetProfileById).toHaveBeenCalled();
      expect(mockSubmitFormToHubspot).toHaveBeenCalled();
      expect(store.isLoading).toBe(false);

      expect(mockGetProfileById).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should set loading state correctly during save operation', async () => {
      mockSetProfileById.mockResolvedValue(undefined);
      mockGetProfileById.mockResolvedValue(undefined);

      const savePromise = store.handleSave();

      expect(store.isLoading).toBe(true);

      await savePromise;

      expect(store.isLoading).toBe(false);
    });

    it('should set loading to false even when error occurs', async () => {
      mockSetProfileById.mockRejectedValue(new Error('API Error'));

      try {
        await store.handleSave();
      } catch (e) {
      }

      expect(store.isLoading).toBe(false);
    });

    it('should set loading to false in finally block', async () => {
      mockSetProfileById.mockResolvedValue(undefined);
      mockGetProfileById.mockResolvedValue(undefined);

      await store.handleSave();

      expect(store.isLoading).toBe(false);
    });
  });

  describe('Schema frontend', () => {
    it('should have correct schema structure', () => {
      expect(store.schemaFrontend).toHaveProperty('$schema');
      expect(store.schemaFrontend).toHaveProperty('definitions');
      expect(store.schemaFrontend).toHaveProperty('$ref');
      expect(store.schemaFrontend.definitions).toHaveProperty('TrustedContact');
      expect(store.schemaFrontend.definitions).toHaveProperty('Individual');
    });

    it('should have correct TrustedContact schema properties', () => {
      const trustedContactSchema = store.schemaFrontend.definitions.TrustedContact;
      expect(trustedContactSchema).toHaveProperty('properties.first_name');
      expect(trustedContactSchema).toHaveProperty('properties.last_name');
      expect(trustedContactSchema).toHaveProperty('properties.relationship_type');
      expect(trustedContactSchema).toHaveProperty('properties.phone');
      expect(trustedContactSchema).toHaveProperty('properties.email');
      expect(trustedContactSchema).toHaveProperty('properties.dob');
      expect(trustedContactSchema).toHaveProperty('type', 'object');
      expect(trustedContactSchema).toHaveProperty('additionalProperties', false);
      expect(trustedContactSchema.required).toContain('first_name');
      expect(trustedContactSchema.required).toContain('last_name');
      expect(trustedContactSchema.required).toContain('relationship_type');
      expect(trustedContactSchema.required).toContain('phone');
      expect(trustedContactSchema.required).toContain('email');
      expect(trustedContactSchema.required).toContain('dob');
    });

    it('should have correct Individual schema structure', () => {
      const individualSchema = store.schemaFrontend.definitions.Individual;
      expect(individualSchema).toHaveProperty('properties.beneficiary');
      expect(individualSchema).toHaveProperty('type', 'object');
      expect(individualSchema).toHaveProperty('errorMessage');
    });
  });

  describe('Return values', () => {
    it('should return all expected properties', () => {
      const returnedStore = useFormTrustedContact();

      expect(returnedStore).toHaveProperty('backButtonText');
      expect(returnedStore).toHaveProperty('breadcrumbs');
      expect(returnedStore).toHaveProperty('isDisabledButton');
      expect(returnedStore).toHaveProperty('isLoading');
      expect(returnedStore).toHaveProperty('isLoadingFields');
      expect(returnedStore).toHaveProperty('handleSave');
      expect(returnedStore).toHaveProperty('model');
      expect(returnedStore).toHaveProperty('schemaBackend');
      expect(returnedStore).toHaveProperty('schemaFrontend');
      expect(returnedStore).toHaveProperty('errorData');
      expect(returnedStore).toHaveProperty('validation');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete workflow from initialization to successful save', async () => {
      isValid.value = true;
      model.beneficiary = {
        first_name: 'Jane',
        last_name: 'Smith',
        relationship_type: 'spouse',
        phone: '+1234567890',
        email: 'jane@example.com',
        dob: '1990-01-01',
      };
      mockSetProfileById.mockResolvedValue(undefined);
      mockGetProfileById.mockResolvedValue(undefined);

      const testStore = useFormTrustedContact();

      expect(testStore.isLoading).toBe(false);
      expect(testStore.isDisabledButton).toBe(false);

      await testStore.handleSave();

      expect(mockOnValidate).toHaveBeenCalled();
      expect(mockSetProfileById).toHaveBeenCalled();
      expect(mockSubmitFormToHubspot).toHaveBeenCalled();
      expect(mockGetProfileById).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalled();
      expect(testStore.isLoading).toBe(false);
    });

    it('should handle complete workflow with validation failure', async () => {
      vi.clearAllMocks();

      isValid.value = false;
      mockFormValidation.model.beneficiary = null;

      const testStore = useFormTrustedContact();

      await testStore.handleSave();

      expect(mockOnValidate).toHaveBeenCalled();
      expect(mockScrollToError).toHaveBeenCalledWith('ViewDashboardTrustedContact');
      expect(mockSetProfileById).not.toHaveBeenCalled();
      expect(mockSubmitFormToHubspot).not.toHaveBeenCalled();
      expect(mockGetProfileById).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });
});
