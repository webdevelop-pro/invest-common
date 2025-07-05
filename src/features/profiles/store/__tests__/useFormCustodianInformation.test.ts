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
import { useFormCustodianInformation } from '../useFormCustodianInformation';

const mockFormRef = ref<any>(null);

vi.mock('vue', async () => {
  const vue = await vi.importActual('vue');
  return {
    ...vue,
    useTemplateRef: (name: string) => {
      if (name === 'custodianInformationFormChild') {
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

const selectedUserProfileId = ref('123');
const selectedUserProfileType = ref('individual');
const selectedUserProfileData = ref({
  data: {
    full_account_name: 'John Doe IRA',
    type: 'self-directed',
    account_number: '123456789',
  },
  user_id: 'user123',
  id: 'profile123',
  escrow_id: null,
});
const mockProfilesStore = {
  selectedUserProfileId,
  selectedUserProfileType,
  selectedUserProfileData,
};
vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: vi.fn(() => mockProfilesStore),
}));

const mockSetProfileById = vi.fn();
const mockGetProfileById = vi.fn();
const setProfileByIdState = ref({ error: null });
const getProfileByIdOptionsState = ref({
  data: {
    full_account_name: 'John Doe IRA',
    type: 'self-directed',
    account_number: '123456789',
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

const userSessionTraits = ref({ email: 'john@example.com' });
vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: vi.fn(() => ({
    userSessionTraits,
  })),
}));

vi.mock('InvestCommon/composable/useHubspotForm', () => ({
  useHubspotForm: vi.fn((formId: string) => ({
    submitFormToHubspot: vi.fn(),
  })),
}));

vi.mock('UiKit/helpers/validation/general', () => ({
  scrollToError: vi.fn(),
}));

vi.mock('InvestCommon/global', () => ({
  default: {
    HUBSPOT_FORM_ID_CUSTODIAN: 'test-custodian-hubspot-form-id',
  },
}));

vi.mock('InvestCommon/types/form', () => ({
  FormChild: vi.fn(),
}));

const makeFormChild = (isValid = true, model = {}, onValidate = vi.fn()) => ({ 
  isValid: isValid, 
  model: model, 
  onValidate: onValidate,
});

describe('useFormCustodianInformation', () => {
  let store: ReturnType<typeof useFormCustodianInformation>;
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
    mockHubspotForm = vi.mocked(useHubspotForm)('test-custodian-hubspot-form-id');
    mockScrollToError = vi.mocked(scrollToError);

    vi.clearAllMocks();

    setProfileByIdState.value = { error: null };

    mockFormRef.value = makeFormChild(false, {}, vi.fn());

    store = useFormCustodianInformation();
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
          text: 'Custodian Information',
        },
      ]);
    });

    it('should compute model data correctly', () => {
      expect(store.modelData).toEqual({
        full_account_name: 'John Doe IRA',
        type: 'self-directed',
        account_number: '123456789',
      });
    });

    it('should compute schema backend correctly', () => {
      expect(store.schemaBackend).toEqual({
        full_account_name: 'John Doe IRA',
        type: 'self-directed',
        account_number: '123456789',
      });
    });
  });

  describe('Computed properties', () => {
    it('should compute isDisabledButton based on form validity', () => {
      mockFormRef.value = makeFormChild(false, {}, vi.fn());
      const newStore = useFormCustodianInformation();
      expect(newStore.isDisabledButton).toBe(true);
    });

    it('should enable button when form is valid', () => {
      mockFormRef.value = makeFormChild(true, {}, vi.fn());
      const newStore = useFormCustodianInformation();
      expect(newStore.isDisabledButton).toBe(false);
    });

    it('should handle undefined form child', () => {
      mockFormRef.value = null;
      const newStore = useFormCustodianInformation();
      expect(newStore.isDisabledButton).toBe(true);
    });

    it('should handle undefined model data', () => {
      selectedUserProfileData.value = { data: undefined } as any;
      const newStore = useFormCustodianInformation();
      expect(newStore.modelData).toBeUndefined();
    });

    it('should handle null schema backend data', () => {
      getProfileByIdOptionsState.value.data = null as any;
      const newStore = useFormCustodianInformation();
      expect(newStore.schemaBackend).toBeNull();
    });

    it('should handle loading state', () => {
      getProfileByIdOptionsState.value.loading = true;
      const newStore = useFormCustodianInformation();
      expect(newStore.isLoadingFields).toBe(true);
    });
  });

  describe('handleSave - Validation failure', () => {
    it('should not proceed when form validation fails', async () => {
      mockFormRef.value = makeFormChild(false, {}, vi.fn());
      const newStore = useFormCustodianInformation();

      await newStore.handleSave();

      expect(mockScrollToError).toHaveBeenCalledWith('ViewDashboardCustodianInformation');
      expect(mockRepositoryProfiles.setProfileById).not.toHaveBeenCalled();
      expect(mockHubspotForm.submitFormToHubspot).not.toHaveBeenCalled();
      expect(mockRepositoryProfiles.getProfileById).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should call onValidate when form is invalid', async () => {
      const mockOnValidate = vi.fn();
      mockFormRef.value = makeFormChild(false, {}, mockOnValidate);
      const newStore = useFormCustodianInformation();

      await newStore.handleSave();

      expect(mockOnValidate).toHaveBeenCalled();
    });

    it('should handle undefined form child in validation', async () => {
      mockFormRef.value = null;
      const newStore = useFormCustodianInformation();

      await newStore.handleSave();

      expect(mockScrollToError).toHaveBeenCalledWith('ViewDashboardCustodianInformation');
      expect(mockRepositoryProfiles.setProfileById).not.toHaveBeenCalled();
    });
  });

  describe('handleSave - Success scenarios', () => {
    beforeEach(() => {
      mockRepositoryProfiles.setProfileById.mockResolvedValue(undefined);
      mockRepositoryProfiles.getProfileById.mockResolvedValue(undefined);
      mockFormRef.value = makeFormChild(true, {
        full_account_name: 'John Doe IRA',
        type: 'self-directed',
        account_number: '123456789',
      }, vi.fn());
    });

    it('should save profile successfully and navigate to account page', async () => {
      const newStore = useFormCustodianInformation();

      await newStore.handleSave();

      expect(mockRepositoryProfiles.setProfileById).toHaveBeenCalledWith(
        {
          full_account_name: 'John Doe IRA',
          type: 'self-directed',
          account_number: '123456789',
        },
        'individual',
        '123'
      );
      
      expect(setProfileByIdState.value.error).toBeNull();
      
      expect(vi.mocked(useHubspotForm)).toHaveBeenCalledWith('test-custodian-hubspot-form-id');
      
      const hubspotFormMock = vi.mocked(useHubspotForm).mock.results[0].value;
      expect(hubspotFormMock.submitFormToHubspot).toHaveBeenCalledWith({
        email: 'john@example.com',
        full_account_name: 'John Doe IRA',
        type: 'self-directed',
        account_number: '123456789',
      });
      
      expect(mockRepositoryProfiles.getProfileById).toHaveBeenCalledWith('individual', '123');
      expect(mockRouter.push).toHaveBeenCalledWith({
        name: ROUTE_DASHBOARD_ACCOUNT,
        params: { profileId: '123' }
      });
    });

    it('should set loading state during save operation', async () => {
      const newStore = useFormCustodianInformation();

      const savePromise = newStore.handleSave();
      expect(newStore.isLoading).toBe(true);

      await savePromise;
      expect(newStore.isLoading).toBe(false);
    });

    it('should call onValidate before saving', async () => {
      const mockOnValidate = vi.fn();
      mockFormRef.value = makeFormChild(true, {
        full_account_name: 'John Doe IRA',
        type: 'self-directed',
        account_number: '123456789',
      }, mockOnValidate);
      const newStore = useFormCustodianInformation();

      await newStore.handleSave();

      expect(mockOnValidate).toHaveBeenCalled();
    });

    it('should handle empty model data', async () => {
      mockFormRef.value = makeFormChild(true, {}, vi.fn());
      const newStore = useFormCustodianInformation();

      await newStore.handleSave();

      expect(mockRepositoryProfiles.setProfileById).toHaveBeenCalledWith(
        {},
        'individual',
        '123'
      );
    });

    it('should handle undefined model data', async () => {
      mockFormRef.value = makeFormChild(true, undefined, vi.fn());
      const newStore = useFormCustodianInformation();

      await newStore.handleSave();

      expect(mockRepositoryProfiles.setProfileById).toHaveBeenCalledWith(
        {},
        'individual',
        '123'
      );
    });
  });

  describe('handleSave - Error scenarios', () => {
    beforeEach(() => {
      mockFormRef.value = makeFormChild(true, {
        full_account_name: 'John Doe IRA',
        type: 'self-directed',
        account_number: '123456789',
      }, vi.fn());
    });

    it('should not submit to Hubspot when setProfileById fails', async () => {
      setProfileByIdState.value.error = 'Some error occurred' as any;
      const newStore = useFormCustodianInformation();

      await newStore.handleSave();

      expect(mockRepositoryProfiles.setProfileById).toHaveBeenCalled();
      expect(mockHubspotForm.submitFormToHubspot).not.toHaveBeenCalled();
      expect(mockRepositoryProfiles.getProfileById).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalled();
    });

    it('should handle setProfileById rejection', async () => {
      mockRepositoryProfiles.setProfileById.mockRejectedValue(new Error('Network error'));
      const newStore = useFormCustodianInformation();

      await expect(newStore.handleSave()).rejects.toThrow('Network error');
      expect(newStore.isLoading).toBe(false);
    });

    it('should handle getProfileById rejection', async () => {
      mockRepositoryProfiles.getProfileById.mockRejectedValue(new Error('Profile fetch error'));
      const mockOnValidate = vi.fn();
      
      mockFormRef.value = makeFormChild(true, {
        full_account_name: 'John Doe IRA',
        type: 'self-directed',
        account_number: '123456789',
      }, mockOnValidate);
      
      const newStore = useFormCustodianInformation();

      // Since getProfileById is not awaited, the promise should resolve
      await newStore.handleSave();
      
      expect(newStore.isLoading).toBe(false);
      expect(mockOnValidate).toHaveBeenCalled();
      expect(mockRepositoryProfiles.getProfileById).toHaveBeenCalledWith('individual', '123');
    });

    it('should ensure loading state is reset on error', async () => {
      mockRepositoryProfiles.setProfileById.mockRejectedValue(new Error('Network error'));
      const newStore = useFormCustodianInformation();

      try {
        await newStore.handleSave();
      } catch (error) {
      }

      expect(newStore.isLoading).toBe(false);
    });
  });
});
