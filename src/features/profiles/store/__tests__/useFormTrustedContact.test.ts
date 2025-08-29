/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useHubspotForm } from 'UiKit/composables/useHubspotForm';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/domain/config/enums/routes';
import { useFormTrustedContact } from '../useFormTrustedContact';

const mockRouterInstance = {
  push: vi.fn(),
  currentRoute: { value: { query: {} } },
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

const userSessionTraits = ref({ email: 'john@example.com' });

const mockSetProfileById = vi.fn();
const mockGetProfileById = vi.fn();
const setProfileByIdState = ref({ error: null });
const getProfileByIdOptionsState = ref({
  data: null,
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
  useSessionStore: vi.fn(() => ({ userSessionTraits })),
}));

const mockSubmitFormToHubspot = vi.fn();
vi.mock('UiKit/composables/useHubspotForm', () => ({
  useHubspotForm: vi.fn(() => ({ submitFormToHubspot: mockSubmitFormToHubspot })),
}));

vi.mock('InvestCommon/global', () => ({
  default: { HUBSPOT_FORM_ID_TRUSTED_CONTACT: 'test-hubspot-form-id' },
}));

describe('useFormTrustedContact', () => {
  let composable: ReturnType<typeof useFormTrustedContact>;
  let mockRouter: any;
  let mockProfilesStore: any;
  let mockRepositoryProfiles: any;
  let mockSessionStore: any;
  let mockHubspotForm: any;

  beforeEach(() => {
    setActivePinia(createPinia());

    mockRouter = vi.mocked(useRouter)();
    mockProfilesStore = vi.mocked(useProfilesStore)();
    mockRepositoryProfiles = vi.mocked(useRepositoryProfiles)();
    mockSessionStore = vi.mocked(useSessionStore)();
    mockHubspotForm = vi.mocked(useHubspotForm)();

    vi.clearAllMocks();

    selectedUserProfileType.value = 'individual';
    selectedUserProfileId.value = '123';
    selectedUserProfileData.value = {
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
    };
    userSessionTraits.value = { email: 'john@example.com' };

    composable = useFormTrustedContact();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize model with beneficiary data from profile', () => {
      expect(composable.model.beneficiary).toEqual({
        first_name: 'Jane',
        last_name: 'Smith',
        relationship_type: 'spouse',
        phone: '+1234567890',
        email: 'jane@example.com',
        dob: '1990-01-01',
      });
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
      const newComposable = useFormTrustedContact();

      expect(newComposable.model.beneficiary).toEqual(newBeneficiary);
    });
  });

  describe('handleSave', () => {
    describe('Validation failure', () => {
      it('should not proceed when form validation fails', async () => {
        composable.model.beneficiary = {
          first_name: '', // Empty required field
          last_name: '',
          relationship_type: '',
          phone: '',
          email: '',
          dob: '',
        };

        await composable.handleSave();

        expect(mockSetProfileById).not.toHaveBeenCalled();
        expect(mockSubmitFormToHubspot).not.toHaveBeenCalled();
      });

      it('should not proceed when beneficiary model is null/undefined', async () => {
        composable.model.beneficiary = null as any;
        await composable.handleSave();
        expect(mockSetProfileById).not.toHaveBeenCalled();

        composable.model.beneficiary = undefined as any;
        await composable.handleSave();
        expect(mockSetProfileById).not.toHaveBeenCalled();
      });
    });

    describe('Success scenarios', () => {
      beforeEach(() => {
        mockSetProfileById.mockResolvedValue(undefined);
        mockGetProfileById.mockResolvedValue(undefined);
        
        composable.model.beneficiary = {
          first_name: 'Jane',
          last_name: 'Smith',
          relationship_type: 'spouse',
          phone: '+1234567890',
          email: 'jane@example.com',
          dob: '1990-01-01',
        };
      });

      it('should save profile successfully and navigate to account page', async () => {
        await composable.handleSave();

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

      it('should handle different profile types and user emails', async () => {
        // Test different profile type
        mockProfilesStore.selectedUserProfileType.value = 'entity';
        mockProfilesStore.selectedUserProfileId.value = '456';
        const testComposable = useFormTrustedContact();
        await testComposable.handleSave();
        expect(mockSetProfileById).toHaveBeenCalledWith(
          expect.any(Object), 'entity', '456'
        );

        // Test different user email
        userSessionTraits.value.email = 'different@example.com';
        await composable.handleSave();
        expect(mockSubmitFormToHubspot).toHaveBeenCalledWith(
          expect.objectContaining({ email: 'different@example.com' })
        );
      });
    });

    describe('Error handling', () => {
      beforeEach(() => {
        composable.model.beneficiary = {
          first_name: 'Jane',
          last_name: 'Smith',
          relationship_type: 'spouse',
          phone: '+1234567890',
          email: 'jane@example.com',
          dob: '1990-01-01',
        };
      });

      it('should handle API errors gracefully', async () => {
        mockSetProfileById.mockRejectedValue(new Error('API Error'));

        try {
          await composable.handleSave();
        } catch (e) {
          // ignore
        }

        expect(mockSetProfileById).toHaveBeenCalled();
        expect(mockSubmitFormToHubspot).not.toHaveBeenCalled();
        expect(composable.isLoading.value).toBe(false);
      });

      it('should handle hubspot errors gracefully', async () => {
        mockSetProfileById.mockResolvedValue(undefined);
        mockSubmitFormToHubspot.mockImplementation(() => {
          throw new Error('Hubspot Error');
        });

        try {
          await composable.handleSave();
        } catch (e) {
          // ignore
        }

        expect(mockSetProfileById).toHaveBeenCalled();
        expect(mockSubmitFormToHubspot).toHaveBeenCalled();
        expect(composable.isLoading.value).toBe(false);
      });

      it('should manage loading state correctly', async () => {
        mockSetProfileById.mockResolvedValue(undefined);
        mockGetProfileById.mockResolvedValue(undefined);

        const savePromise = composable.handleSave();
        expect(composable.isLoading.value).toBe(true);

        await savePromise;
        expect(composable.isLoading.value).toBe(false);
      });
    });
  });

  describe('Schema validation', () => {
    it('should have correct schema structure', () => {
      expect(composable.schemaFrontend.value).toHaveProperty('$schema');
      expect(composable.schemaFrontend.value).toHaveProperty('definitions');
      expect(composable.schemaFrontend.value.definitions).toHaveProperty('PersonalInformation');
      expect(composable.schemaFrontend.value.definitions).toHaveProperty('Individual');
    });

    it('should have correct PersonalInformation schema properties', () => {
      const definitions = composable.schemaFrontend.value.definitions;
      const personalInformationSchema = definitions?.PersonalInformation;
      
      expect(personalInformationSchema).toBeDefined();
      expect(personalInformationSchema!).toHaveProperty('type', 'object');
      expect(personalInformationSchema!.required).toContain('first_name');
      expect(personalInformationSchema!.required).toContain('last_name');
      expect(personalInformationSchema!.required).toContain('relationship_type');
      expect(personalInformationSchema!.required).toContain('phone');
      expect(personalInformationSchema!.required).toContain('email');
      expect(personalInformationSchema!.required).toContain('dob');
    });
  });

  describe('Integration workflow', () => {
    it('should handle complete successful workflow', async () => {
      mockSetProfileById.mockResolvedValue(undefined);
      mockGetProfileById.mockResolvedValue(undefined);

      const testComposable = useFormTrustedContact();

      expect(testComposable.isLoading.value).toBe(false);
      expect(testComposable.isDisabledButton.value).toBe(false);

      await testComposable.handleSave();

      expect(mockSetProfileById).toHaveBeenCalled();
      expect(mockSubmitFormToHubspot).toHaveBeenCalled();
      expect(mockGetProfileById).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalled();
      expect(testComposable.isLoading.value).toBe(false);
    });

    it('should handle validation failure workflow', async () => {
      const testComposable = useFormTrustedContact();
      
      testComposable.model.beneficiary = {
        first_name: '', // Empty required field
        last_name: '',
        relationship_type: '',
        phone: '',
        email: '',
        dob: '',
      };

      await testComposable.handleSave();

      expect(mockSetProfileById).not.toHaveBeenCalled();
      expect(mockSubmitFormToHubspot).not.toHaveBeenCalled();
      expect(mockGetProfileById).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });
});
