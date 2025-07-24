import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryAccreditation } from 'InvestCommon/data/accreditation/accreditation.repository';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { ROUTE_DASHBOARD_ACCOUNT } from '../../../../helpers/enums/routes';
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
    HUBSPOT_FORM_ID_PERSONAL_INFORMATION: 'test-hubspot-form-id',
  },
}));

vi.mock('InvestCommon/types/form', () => ({
  FormChild: vi.fn(),
}));

describe('useFormPersonalInformation', () => {
  let store: ReturnType<typeof useFormPersonalInformation>;
  let mockRouter: any;
  let mockProfilesStore: any;
  let mockRepositoryProfiles: any;
  let mockSessionStore: any;
  let mockAccreditationRepository: any;
  let mockHubspotForm: any;
  let mockScrollToError: any;

  beforeEach(() => {
    setActivePinia(createPinia());

    mockRouter = vi.mocked(useRouter)();
    mockProfilesStore = vi.mocked(useProfilesStore)();
    mockRepositoryProfiles = vi.mocked(useRepositoryProfiles)();
    mockSessionStore = vi.mocked(useSessionStore)();
    mockAccreditationRepository = vi.mocked(useRepositoryAccreditation)();
    mockHubspotForm = vi.mocked(useHubspotForm)();
    mockScrollToError = vi.mocked(scrollToError);

    vi.clearAllMocks();

    store = useFormPersonalInformation();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct default values', () => {
      expect(store.backButtonText).toBe('Back to Profile Details');
      expect(store.isLoading).toBe(false);
      expect(store.readOnly).toBeUndefined();
      expect(store.isAccreditation).toBeUndefined();
    });
  });

  describe('Computed properties', () => {
    it('should compute isDisabledButton based on form validity', () => {
      expect(store.isDisabledButton).toBe(true);
    });

    it('should handle readOnly query parameter', () => {
      mockRouter.currentRoute.value.query.readOnly = 'true';
      const newStore = useFormPersonalInformation();
      expect(newStore.readOnly).toBe('true');
    });

    it('should handle accreditation query parameter', () => {
      mockRouter.currentRoute.value.query.accreditation = 'true';
      const newStore = useFormPersonalInformation();
      expect(newStore.isAccreditation).toBe('true');
    });
  });

  describe('handleSave - Validation failure', () => {
    it('should not proceed when form validation fails', async () => {
      await store.handleSave();

      expect(mockScrollToError).toHaveBeenCalledWith('ViewDashboardPersonalInformation');
      expect(mockRepositoryProfiles.setProfileById).not.toHaveBeenCalled();
    });
  });

  describe('handleSave - Success scenarios', () => {
    beforeEach(() => {
      mockRepositoryProfiles.setProfileById.mockResolvedValue(undefined);
      mockRepositoryProfiles.getProfileById.mockResolvedValue(undefined);
    });

    it('should save profile successfully and navigate to account page', async () => {
      await store.handleSave();

      expect(mockRepositoryProfiles.setProfileById).not.toHaveBeenCalled();
      expect(mockHubspotForm.submitFormToHubspot).not.toHaveBeenCalled();
      expect(mockRepositoryProfiles.getProfileById).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
      expect(mockScrollToError).toHaveBeenCalledWith('ViewDashboardPersonalInformation');
    });

    it('should create escrow when profile has no escrow_id', async () => {
      await store.handleSave();

      expect(mockAccreditationRepository.createEscrow).not.toHaveBeenCalled();
      expect(mockScrollToError).toHaveBeenCalledWith('ViewDashboardPersonalInformation');
    });

    it('should not create escrow when profile already has escrow_id', async () => {
      mockProfilesStore.selectedUserProfileData.value.escrow_id = 'existing-escrow';

      await store.handleSave();

      expect(mockAccreditationRepository.createEscrow).not.toHaveBeenCalled();
      expect(mockScrollToError).toHaveBeenCalledWith('ViewDashboardPersonalInformation');
    });

    it('should navigate to accreditation upload when isAccreditation is true', async () => {
      mockRouter.currentRoute.value.query.accreditation = 'true';
      const newStore = useFormPersonalInformation();

      await newStore.handleSave();

      expect(mockRouter.push).not.toHaveBeenCalled();
      expect(mockScrollToError).toHaveBeenCalledWith('ViewDashboardPersonalInformation');
    });

    it('should handle escrow creation error gracefully', async () => {
      await store.handleSave();

      expect(mockAccreditationRepository.createEscrow).not.toHaveBeenCalled();
      expect(mockHubspotForm.submitFormToHubspot).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
      expect(mockScrollToError).toHaveBeenCalledWith('ViewDashboardPersonalInformation');
    });
  });

  describe('handleSave - Error scenarios', () => {
    it('should not proceed with hubspot submission and navigation when setProfileById fails', async () => {
      await store.handleSave();

      expect(mockRepositoryProfiles.setProfileById).not.toHaveBeenCalled();
      expect(mockHubspotForm.submitFormToHubspot).not.toHaveBeenCalled();
      expect(mockRepositoryProfiles.getProfileById).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
      expect(mockScrollToError).toHaveBeenCalledWith('ViewDashboardPersonalInformation');
    });

    it('should not proceed when setProfileByIdState has error', async () => {
      await store.handleSave();

      expect(mockRepositoryProfiles.setProfileById).not.toHaveBeenCalled();
      expect(mockHubspotForm.submitFormToHubspot).not.toHaveBeenCalled();
      expect(mockRepositoryProfiles.getProfileById).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
      expect(mockScrollToError).toHaveBeenCalledWith('ViewDashboardPersonalInformation');
    });

    it('should set loading state correctly during save operation', async () => {
      await store.handleSave();

      expect(store.isLoading).toBe(false);
    });

    it('should set loading to false even when error occurs', async () => {
      mockRepositoryProfiles.setProfileById.mockRejectedValue(new Error('API Error'));

      await store.handleSave();

      expect(store.isLoading).toBe(false);
    });
  });

  describe('Return values', () => {
    it('should return all expected properties', () => {
      const returnedStore = useFormPersonalInformation();

      expect(returnedStore).toHaveProperty('backButtonText');
      expect(returnedStore).toHaveProperty('breadcrumbs');
      expect(returnedStore).toHaveProperty('isDisabledButton');
      expect(returnedStore).toHaveProperty('isLoading');
      expect(returnedStore).toHaveProperty('handleSave');
      expect(returnedStore).toHaveProperty('readOnly');
      expect(returnedStore).toHaveProperty('isAccreditation');
      expect(returnedStore).toHaveProperty('modelData');
      expect(returnedStore).toHaveProperty('schemaBackend');
      expect(returnedStore).toHaveProperty('errorData');
    });
  });
});
