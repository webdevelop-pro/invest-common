import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryAccreditation } from 'InvestCommon/data/accreditation/accreditation.repository';
import { useHubspotForm } from 'UiKit/composables/useHubspotForm';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/domain/config/enums/routes';
import { useFormPersonalInformation } from '../useFormPersonalInformation';

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
    selectedUserProfileType: ref('individual'),
    selectedUserProfileData: ref({
      data: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
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
    setUser: vi.fn(),
    getUser: vi.fn(),
    setProfileByIdState: ref({ error: null }),
    getProfileByIdOptionsState: ref({ data: { schema: 'test-schema' } }),
  })),
}));

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: vi.fn(() => ({
    userSessionTraits: ref({ email: 'john@example.com' }),
  })),
}));

vi.mock('InvestCommon/data/accreditation/accreditation.repository', () => ({
  useRepositoryAccreditation: vi.fn(() => ({
    createEscrow: vi.fn(),
  })),
}));

vi.mock('UiKit/composables/useHubspotForm', () => ({
  useHubspotForm: vi.fn(() => ({
    submitFormToHubspot: vi.fn(),
  })),
}));

vi.mock('UiKit/helpers/validation/general', () => ({
  scrollToError: vi.fn(),
}));

vi.mock('InvestCommon/domain/config/env', () => ({
  default: {
    HUBSPOT_FORM_ID_PERSONAL_INFORMATION: 'test-hubspot-form-id',
  },
}));

vi.mock('InvestCommon/types/form', () => ({
  FormChild: vi.fn(),
}));

const mockFormRef = {
  value: {
    isValid: false,
    onValidate: vi.fn(),
    model: {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      dob: '1990-01-01',
    },
  },
};

vi.mock('vue', async () => {
  const actual = await vi.importActual('vue');
  return {
    ...actual,
    useTemplateRef: vi.fn(() => mockFormRef),
  };
});

describe('useFormPersonalInformation', () => {
  let composable: ReturnType<typeof useFormPersonalInformation>;
  let mockRouter: any;
  let mockProfilesStore: any;
  let mockRepositoryProfiles: any;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let mockSessionStore: any;
  let mockAccreditationRepository: any;
  let mockHubspotForm: any;

  beforeEach(() => {
    setActivePinia(createPinia());

    // Mock DOM elements
    const mockElement = {
      scrollIntoView: vi.fn(),
    };
    document.querySelector = vi.fn(() => mockElement);

    mockRouter = vi.mocked(useRouter)();
    mockProfilesStore = {
      selectedUserProfileId: ref('123'),
      selectedUserProfileType: ref('individual'),
      selectedUserProfileData: ref({
        data: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
        },
        user_id: 'user123',
        id: 'profile123',
        escrow_id: null,
      }),
    };
    mockRepositoryProfiles = {
      setProfileByIdState: ref({ error: null }),
      getProfileByIdOptionsState: ref({ data: { schema: 'test-schema' } }),
      setProfileById: vi.fn().mockResolvedValue({}),
      getProfileById: vi.fn().mockResolvedValue({}),
      setUser: vi.fn(),
      getUser: vi.fn(),
    };
    mockSessionStore = vi.mocked(useSessionStore)();
    mockAccreditationRepository = {
      createEscrow: vi.fn().mockResolvedValue({}),
    };
    mockHubspotForm = {
      submitFormToHubspot: vi.fn(),
    };

    vi.mocked(useProfilesStore).mockReturnValue(mockProfilesStore);
    vi.mocked(useRepositoryProfiles).mockReturnValue(mockRepositoryProfiles);
    vi.mocked(useRepositoryAccreditation).mockReturnValue(mockAccreditationRepository);
    vi.mocked(useHubspotForm).mockReturnValue(mockHubspotForm);

    mockFormRef.value.onValidate.mockClear();
    
    mockRouter.currentRoute.value.query = {};

    composable = useFormPersonalInformation();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Computed properties', () => {
    it('should compute isDisabledButton based on form validity', () => {
      expect(composable.isDisabledButton.value).toBe(true);
    });

    it('should enable button when form is valid', () => {
      mockFormRef.value.isValid = true;
      const newComposable = useFormPersonalInformation();
      expect(newComposable.isDisabledButton.value).toBe(false);
    });

    it('should handle readOnly query parameter', () => {
      mockRouter.currentRoute.value.query.readOnly = 'true';
      const newComposable = useFormPersonalInformation();
      expect(newComposable.readOnly.value).toBe(true);
    });

    it('should handle accreditation query parameter', () => {
      mockRouter.currentRoute.value.query.accreditation = 'true';
      const newComposable = useFormPersonalInformation();
      expect(newComposable.isAccreditation.value).toBe('true');
    });

    it('should return correct breadcrumbs', () => {
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
          text: 'Personal Information',
        },
      ]);
    });

    it('should return correct model data', () => {
      expect(composable.modelData.value).toEqual({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      });
    });

    it('should return correct schema backend', () => {
      expect(composable.schemaBackend.value).toEqual({ schema: 'test-schema' });
    });
  });

  describe('handleSave - Validation failure', () => {
    it('should not proceed when form validation fails', async () => {
      mockFormRef.value.isValid = false;
      
      await composable.handleSave();
      await nextTick();

      expect(mockFormRef.value.onValidate).toHaveBeenCalled();
      expect(document.querySelector).toHaveBeenCalledWith('.ViewDashboardPersonalInformation');
      expect(mockRepositoryProfiles.setProfileById).not.toHaveBeenCalled();
    });
  });

  describe('handleSave - Success scenarios', () => {
    beforeEach(() => {
      mockFormRef.value.isValid = true;
      mockRepositoryProfiles.setProfileById = vi.fn().mockResolvedValue({});
      mockRepositoryProfiles.getProfileById = vi.fn().mockResolvedValue(undefined);
    });

    it('should save profile successfully and navigate to account page', async () => {
      await composable.handleSave();

      expect(mockRepositoryProfiles.setProfileById).toHaveBeenCalledWith(
        mockFormRef.value.model,
        'individual',
        '123'
      );
      expect(mockHubspotForm.submitFormToHubspot).toHaveBeenCalledWith({
        ...mockFormRef.value.model,
        email: 'john@example.com',
        date_of_birth: mockFormRef.value.model.dob,
      });
      expect(mockRepositoryProfiles.getProfileById).toHaveBeenCalledWith('individual', '123');
      expect(mockRouter.push).toHaveBeenCalledWith({
        name: ROUTE_DASHBOARD_ACCOUNT,
        params: { profileId: '123' }
      });
    });

    it('should create escrow when profile has no escrow_id', async () => {
      await composable.handleSave();

      expect(mockAccreditationRepository.createEscrow).toHaveBeenCalledWith('user123', 'profile123');
    });

    it('should not create escrow when profile already has escrow_id', async () => {
      mockProfilesStore.selectedUserProfileData.value.escrow_id = 'existing-escrow';

      await composable.handleSave();

      expect(mockAccreditationRepository.createEscrow).not.toHaveBeenCalled();
    });

    it('should navigate to accreditation upload when isAccreditation is true', async () => {
      mockRouter.currentRoute.value.query.accreditation = 'true';
      const newComposable = useFormPersonalInformation();

      await newComposable.handleSave();

      expect(mockRouter.push).toHaveBeenCalledWith({
        name: 'ROUTE_ACCREDITATION_UPLOAD',
        params: { profileId: '123' }
      });
    });

    it('should handle escrow creation error gracefully', async () => {
      mockAccreditationRepository.createEscrow = vi.fn().mockRejectedValue(new Error('Escrow creation failed'));

      await composable.handleSave();

      expect(mockAccreditationRepository.createEscrow).toHaveBeenCalled();
      expect(mockHubspotForm.submitFormToHubspot).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalled();
    });
  });

  describe('handleSave - Error scenarios', () => {
    beforeEach(() => {
      mockFormRef.value.isValid = true;
      mockRepositoryProfiles.setProfileById = vi.fn().mockResolvedValue({});
    });

    it('should not proceed with hubspot submission and navigation when setProfileById fails', async () => {
      mockRepositoryProfiles.setProfileById.mockClear();
      mockHubspotForm.submitFormToHubspot.mockClear();
      mockRepositoryProfiles.getProfileById.mockClear();
      mockRouter.push.mockClear();
      
      mockRepositoryProfiles.setProfileById = vi.fn().mockImplementation(() => {
        mockRepositoryProfiles.setProfileByIdState.value = { error: { data: { responseJson: 'API Error' } } };
        return Promise.resolve();
      });

      await composable.handleSave();

      expect(mockRepositoryProfiles.setProfileById).toHaveBeenCalled();
      expect(mockHubspotForm.submitFormToHubspot).not.toHaveBeenCalled();
      expect(mockRepositoryProfiles.getProfileById).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
      expect(composable.isLoading.value).toBe(false);
    });

    it('should not proceed when setProfileByIdState has error', async () => {
      mockRepositoryProfiles.setProfileById.mockClear();
      mockHubspotForm.submitFormToHubspot.mockClear();
      mockRepositoryProfiles.getProfileById.mockClear();
      mockRouter.push.mockClear();
      
      mockRepositoryProfiles.setProfileByIdState.value = { error: { data: { responseJson: 'Error' } } };

      await composable.handleSave();

      expect(mockRepositoryProfiles.setProfileById).toHaveBeenCalled();
      expect(mockHubspotForm.submitFormToHubspot).not.toHaveBeenCalled();
      expect(mockRepositoryProfiles.getProfileById).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should set loading state correctly during save operation', async () => {
      const savePromise = composable.handleSave();
      
      expect(composable.isLoading.value).toBe(true);
      
      await savePromise;
      
      expect(composable.isLoading.value).toBe(false);
    });

    it('should set loading to false even when error occurs', async () => {
      mockRepositoryProfiles.setProfileById = vi.fn().mockImplementation(() => {
        mockRepositoryProfiles.setProfileByIdState.value = { error: { data: { responseJson: 'API Error' } } };
        return Promise.resolve();
      });

      await composable.handleSave();

      expect(composable.isLoading.value).toBe(false);
      expect(mockRepositoryProfiles.setProfileById).toHaveBeenCalled();
    });
  });
});
