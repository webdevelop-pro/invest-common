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
import { scrollToError } from 'UiKit/helpers/validation/general';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/domain/config/enums/routes';
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

const mockSubmitFormToHubspot = vi.fn();
vi.mock('UiKit/composables/useHubspotForm', () => ({
  useHubspotForm: vi.fn((formId: string) => ({
    submitFormToHubspot: mockSubmitFormToHubspot,
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
  isValid,
  model,
  onValidate,
});

describe('useFormCustodianInformation', () => {
  let composable: ReturnType<typeof useFormCustodianInformation>;
  let mockRouter: any;
  let mockProfilesStore: any;
  let mockRepositoryProfiles: any;
  let mockSessionStore: any;
  let mockHubspotForm: any;
  let mockScrollToError: any;

  beforeEach(() => {
    setActivePinia(createPinia());

    // Mock DOM elements
    const mockElement = {
      scrollIntoView: vi.fn(),
    };
    document.querySelector = vi.fn(() => mockElement);

    mockRouter = vi.mocked(useRouter)();
    mockProfilesStore = vi.mocked(useProfilesStore)();
    mockRepositoryProfiles = vi.mocked(useRepositoryProfiles)();
    mockSessionStore = vi.mocked(useSessionStore)();
    mockHubspotForm = vi.mocked(useHubspotForm)('test-custodian-hubspot-form-id');
    mockScrollToError = vi.mocked(scrollToError);

    vi.clearAllMocks();
    mockSubmitFormToHubspot.mockClear();

    setProfileByIdState.value = { error: null };

    mockFormRef.value = makeFormChild(false, {}, vi.fn());

    composable = useFormCustodianInformation();
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
          text: 'Custodian Information',
        },
      ]);
    });

    it('should compute model data correctly', () => {
      expect(composable.modelData.value).toEqual({
        full_account_name: 'John Doe IRA',
        type: 'self-directed',
        account_number: '123456789',
      });
    });

    it('should compute schema backend correctly', () => {
      expect(composable.schemaBackend.value).toEqual({
        full_account_name: 'John Doe IRA',
        type: 'self-directed',
        account_number: '123456789',
      });
    });
  });

  describe('Computed properties', () => {
    it('should compute isDisabledButton based on form validity', () => {
      mockFormRef.value = makeFormChild(false, {}, vi.fn());
      const newComposable = useFormCustodianInformation();
      expect(newComposable.isDisabledButton.value).toBe(true);
    });

    it('should enable button when form is valid', () => {
      mockFormRef.value = makeFormChild(true, {}, vi.fn());
      const newComposable = useFormCustodianInformation();
      expect(newComposable.isDisabledButton.value).toBe(false);
    });

    it('should handle undefined form child', () => {
      mockFormRef.value = null;
      const newComposable = useFormCustodianInformation();
      expect(newComposable.isDisabledButton.value).toBe(true);
    });

    it('should handle undefined model data', () => {
      selectedUserProfileData.value = { data: undefined } as any;
      const newComposable = useFormCustodianInformation();
      expect(newComposable.modelData.value).toBeUndefined();
    });

    it('should handle null schema backend data', () => {
      getProfileByIdOptionsState.value.data = null as any;
      const newComposable = useFormCustodianInformation();
      expect(newComposable.schemaBackend.value).toBeNull();
    });

    it('should handle loading state', () => {
      getProfileByIdOptionsState.value.loading = true;
      const newComposable = useFormCustodianInformation();
      expect(newComposable.isLoadingFields.value).toBe(true);
    });
  });

  describe('handleSave - Validation failure', () => {
    it('should not proceed when form validation fails', async () => {
      mockFormRef.value = makeFormChild(false, {}, vi.fn());
      const newComposable = useFormCustodianInformation();

      await newComposable.handleSave();

      expect(document.querySelector).toHaveBeenCalledWith('.ViewDashboardCustodianInformation');
      expect(mockRepositoryProfiles.setProfileById).not.toHaveBeenCalled();
      expect(mockHubspotForm.submitFormToHubspot).not.toHaveBeenCalled();
      expect(mockRepositoryProfiles.getProfileById).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should call onValidate when form is invalid', async () => {
      const mockOnValidate = vi.fn();
      mockFormRef.value = makeFormChild(false, {}, mockOnValidate);
      const newComposable = useFormCustodianInformation();

      await newComposable.handleSave();

      expect(mockOnValidate).toHaveBeenCalled();
    });

    it('should handle undefined form child in validation', async () => {
      mockFormRef.value = null;
      const newComposable = useFormCustodianInformation();

      await newComposable.handleSave();

      expect(document.querySelector).toHaveBeenCalledWith('.ViewDashboardCustodianInformation');
      expect(mockRepositoryProfiles.setProfileById).not.toHaveBeenCalled();
    });
  });

  describe('handleSave - Success scenarios', () => {
    beforeEach(() => {
      mockRepositoryProfiles.setProfileById.mockResolvedValue(undefined);
      mockRepositoryProfiles.getProfileById.mockResolvedValue(undefined);
      setProfileByIdState.value = { error: null };
      mockFormRef.value = makeFormChild(true, {
        full_account_name: 'John Doe IRA',
        type: 'self-directed',
        account_number: '123456789',
      }, vi.fn());
    });

    it('should save profile successfully and navigate to account page', async () => {
      const newComposable = useFormCustodianInformation();

      await newComposable.handleSave();

      expect(mockRepositoryProfiles.setProfileById).toHaveBeenCalledWith(
        {
          full_account_name: 'John Doe IRA',
          type: 'self-directed',
          account_number: '123456789',
        },
        'individual',
        '123',
      );

      expect(setProfileByIdState.value.error).toBeNull();

      expect(vi.mocked(useHubspotForm)).toHaveBeenCalledWith('test-custodian-hubspot-form-id');

      expect(mockSubmitFormToHubspot).toHaveBeenCalledWith({
        email: 'john@example.com',
        full_account_name: 'John Doe IRA',
        type: 'self-directed',
        account_number: '123456789',
      });

      expect(mockRepositoryProfiles.getProfileById).toHaveBeenCalledWith('individual', '123');
      expect(mockRouter.push).toHaveBeenCalledWith({
        name: ROUTE_DASHBOARD_ACCOUNT,
        params: { profileId: '123' },
      });
    });

    it('should set loading state during save operation', async () => {
      const newComposable = useFormCustodianInformation();

      const savePromise = newComposable.handleSave();
      expect(newComposable.isLoading.value).toBe(true);

      await savePromise;
      expect(newComposable.isLoading.value).toBe(false);
    });

    it('should call onValidate before saving', async () => {
      const mockOnValidate = vi.fn();
      mockFormRef.value = makeFormChild(true, {
        full_account_name: 'John Doe IRA',
        type: 'self-directed',
        account_number: '123456789',
      }, mockOnValidate);
      const newComposable = useFormCustodianInformation();

      await newComposable.handleSave();

      expect(mockOnValidate).toHaveBeenCalled();
    });

    it('should handle empty model data', async () => {
      mockFormRef.value = makeFormChild(true, {}, vi.fn());
      const newComposable = useFormCustodianInformation();

      await newComposable.handleSave();

      expect(mockRepositoryProfiles.setProfileById).toHaveBeenCalledWith(
        {},
        'individual',
        '123',
      );
    });

    it('should handle undefined model data', async () => {
      mockFormRef.value = makeFormChild(true, undefined, vi.fn());
      const newComposable = useFormCustodianInformation();

      await newComposable.handleSave();

      expect(mockRepositoryProfiles.setProfileById).toHaveBeenCalledWith(
        {},
        'individual',
        '123',
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
      const newComposable = useFormCustodianInformation();

      await newComposable.handleSave();

      expect(mockRepositoryProfiles.setProfileById).toHaveBeenCalled();
      expect(mockSubmitFormToHubspot).not.toHaveBeenCalled();
      expect(mockRepositoryProfiles.getProfileById).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalled();
    });

    it('should handle setProfileById rejection', async () => {
      mockRepositoryProfiles.setProfileById.mockRejectedValue(new Error('Network error'));
      const newComposable = useFormCustodianInformation();

      await expect(newComposable.handleSave()).rejects.toThrow('Network error');
      expect(newComposable.isLoading.value).toBe(false);
    });

    it('should handle getProfileById rejection', async () => {
      mockRepositoryProfiles.getProfileById.mockRejectedValue(new Error('Profile fetch error'));
      const mockOnValidate = vi.fn();

      mockFormRef.value = makeFormChild(true, {
        full_account_name: 'John Doe IRA',
        type: 'self-directed',
        account_number: '123456789',
      }, mockOnValidate);

      const newComposable = useFormCustodianInformation();

      await newComposable.handleSave();

      expect(newComposable.isLoading.value).toBe(false);
      expect(mockOnValidate).toHaveBeenCalled();
      expect(mockRepositoryProfiles.getProfileById).toHaveBeenCalledWith('individual', '123');
    });

    it('should ensure loading state is reset on error', async () => {
      mockRepositoryProfiles.setProfileById.mockRejectedValue(new Error('Network error'));
      const newComposable = useFormCustodianInformation();

      try {
        await newComposable.handleSave();
      } catch (error) {
      }

      expect(newComposable.isLoading.value).toBe(false);
    });
  });
});
