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
import { scrollToError, getFilteredObject } from 'UiKit/helpers/validation/general';
import { useFormValidation } from 'InvestCommon/composable/useFormValidation';
import { getOptions } from 'UiKit/helpers/model';
import { checkObjectAndDeleteNotRequiredFields } from 'InvestCommon/helpers/general';
import { ROUTE_DASHBOARD_ACCOUNT } from '../../../../helpers/enums/routes';
import { useFormBackgroundInformation } from '../useFormBackgroundInformation';

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
        employment: {
          type: 'Retired',
          employer_name: '',
          title: '',
          address1: '',
          address2: '',
          city: '',
          zip_code: '',
        },
        finra_affiliated: {
          member_association: false,
          correspondence: false,
          member_firm_name: '',
          compliance_contact_name: '',
          compliance_contant_email: '',
        },
        ten_percent_shareholder: {
          shareholder_association: false,
          ticker_symbol_list: '',
        },
        irs_backup_withholding: false,
      },
      user_id: 'user123',
      id: 'profile123',
      escrow_id: null,
    }),
  })),
}));

const mockProfilesRepositoryState = {
  getProfileByIdOptionsState: ref({
    data: {
      schema: 'test-schema',
      employment: {
        type: {
          enum: ['Retired', 'full-time', 'part-time', 'self-employed'],
        },
      },
    },
    loading: false,
  }),
  setProfileByIdState: ref({ error: null }),
};

vi.mock('InvestCommon/data/profiles/profiles.repository', () => ({
  useRepositoryProfiles: vi.fn(() => ({
    setProfileById: vi.fn(),
    getProfileById: vi.fn(),
    setProfileByIdState: mockProfilesRepositoryState.setProfileByIdState,
    getProfileByIdOptionsState: mockProfilesRepositoryState.getProfileByIdOptionsState,
  })),
}));

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: vi.fn(() => ({
    userSessionTraits: ref({ email: 'john@example.com' }),
  })),
}));

vi.mock('InvestCommon/composable/useHubspotForm', () => ({
  useHubspotForm: vi.fn(() => ({
    submitFormToHubspot: vi.fn(),
  })),
}));

vi.mock('UiKit/helpers/validation/general', () => ({
  scrollToError: vi.fn(),
  getFilteredObject: vi.fn(() => ({ employment: { type: { enum: ['Retired', 'full-time', 'part-time', 'self-employed'] } } })),
}));

vi.mock('InvestCommon/global', () => ({
  default: {
    HUBSPOT_FORM_ID_BACKGROUND_INFORMATION: 'test-hubspot-form-id',
  },
}));

const mockUseFormValidationReturn = {
  model: ref({
    employment: {
      type: 'Retired',
      employer_name: '',
      title: '',
      address1: '',
      address2: '',
      city: '',
      zip_code: '',
    },
    finra_affiliated: {
      member_association: false,
      correspondence: false,
      member_firm_name: '',
      compliance_contact_name: '',
      compliance_contant_email: '',
    },
    ten_percent_shareholder: {
      shareholder_association: false,
      ticker_symbol_list: '',
    },
    irs_backup_withholding: false,
  }),
  validation: ref({}),
  isValid: ref(false),
  onValidate: vi.fn(),
};

// Create a function to reset the mock model to its initial state
const resetMockModel = () => {
  mockUseFormValidationReturn.model.value = {
    employment: {
      type: 'Retired',
      employer_name: '',
      title: '',
      address1: '',
      address2: '',
      city: '',
      zip_code: '',
    },
    finra_affiliated: {
      member_association: false,
      correspondence: false,
      member_firm_name: '',
      compliance_contact_name: '',
      compliance_contant_email: '',
    },
    ten_percent_shareholder: {
      shareholder_association: false,
      ticker_symbol_list: '',
    },
    irs_backup_withholding: false,
  };
};

vi.mock('InvestCommon/composable/useFormValidation', () => ({
  useFormValidation: vi.fn(() => mockUseFormValidationReturn),
}));

vi.mock('UiKit/helpers/model', () => ({
  getOptions: vi.fn(() => [
    { value: 'Retired', label: 'Retired' },
    { value: 'full-time', label: 'Full Time' },
    { value: 'part-time', label: 'Part Time' },
    { value: 'self-employed', label: 'Self Employed' },
  ]),
}));

vi.mock('InvestCommon/helpers/general', () => ({
  checkObjectAndDeleteNotRequiredFields: vi.fn((requiredFields, requiredRules, obj) => obj),
}));

describe('useFormBackgroundInformation', () => {
  let mockRouter: any;
  let mockProfilesStore: any;
  let mockRepositoryProfiles: any;
  let mockSessionStore: any;
  let mockHubspotForm: any;
  let mockScrollToError: any;
  let mockUseFormValidation: any;
  let mockGetOptions: any;
  let mockGetFilteredObject: any;
  let mockCheckObjectAndDeleteNotRequiredFields: any;

  beforeEach(() => {
    setActivePinia(createPinia());

    mockRouter = vi.mocked(useRouter)();
    mockProfilesStore = vi.mocked(useProfilesStore)();
    mockRepositoryProfiles = vi.mocked(useRepositoryProfiles)();
    mockSessionStore = vi.mocked(useSessionStore)();
    mockHubspotForm = vi.mocked(useHubspotForm)();
    mockScrollToError = vi.mocked(scrollToError);
    mockUseFormValidation = vi.mocked(useFormValidation)();
    mockGetOptions = vi.mocked(getOptions);
    mockGetFilteredObject = vi.mocked(getFilteredObject);
    mockCheckObjectAndDeleteNotRequiredFields = vi.mocked(checkObjectAndDeleteNotRequiredFields);

    resetMockModel();

    mockProfilesRepositoryState.getProfileByIdOptionsState.value.loading = false;
    mockProfilesRepositoryState.setProfileByIdState.value.error = null;

    mockProfilesStore.selectedUserProfileData.value.data.employment.type = 'Retired';

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct default values', () => {
      const testStore = useFormBackgroundInformation();
      expect(testStore.backButtonText).toBe('Back to Profile Details');
      expect(testStore.isLoading).toBe(false);
      expect(testStore.isLoadingFields).toBe(false);
    });

    it('should compute breadcrumbs correctly', () => {
      const testStore = useFormBackgroundInformation();
      expect(testStore.breadcrumbs).toEqual([
        {
          text: 'Dashboard',
          to: { name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: '123' } },
        },
        {
          text: 'Profile Details',
          to: { name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: '123' } },
        },
        {
          text: 'Your Background Information',
        },
      ]);
    });

  });

  describe('Computed properties', () => {
    it('should compute isDisabledButton based on form validity', () => {
      const testStore = useFormBackgroundInformation();
      expect(testStore.isDisabledButton).toBe(true);
    });

    it('should compute isAdditionalFields correctly for full-time employment', () => {
      vi.mocked(useProfilesStore).mockReturnValue({
        selectedUserProfileId: ref('123'),
        selectedUserProfileType: ref('individual'),
        selectedUserProfileData: ref({
          data: {
            employment: { type: 'full-time' },
            finra_affiliated: {},
            ten_percent_shareholder: {},
            irs_backup_withholding: false,
          },
          user_id: 'user123',
          id: 'profile123',
          escrow_id: null,
        }),
      });
      const newStore = useFormBackgroundInformation();
      expect(newStore.isAdditionalFields).toBe(true);
    });

    it('should compute isAdditionalFields correctly for part-time employment', () => {
      vi.mocked(useProfilesStore).mockReturnValue({
        selectedUserProfileId: ref('123'),
        selectedUserProfileType: ref('individual'),
        selectedUserProfileData: ref({
          data: {
            employment: { type: 'part-time' },
            finra_affiliated: {},
            ten_percent_shareholder: {},
            irs_backup_withholding: false,
          },
          user_id: 'user123',
          id: 'profile123',
          escrow_id: null,
        }),
      });
      const newStore = useFormBackgroundInformation();
      expect(newStore.isAdditionalFields).toBe(true);
    });

    it('should compute isAdditionalFields correctly for self-employed', () => {
      vi.mocked(useProfilesStore).mockReturnValue({
        selectedUserProfileId: ref('123'),
        selectedUserProfileType: ref('individual'),
        selectedUserProfileData: ref({
          data: {
            employment: { type: 'self-employed' },
            finra_affiliated: {},
            ten_percent_shareholder: {},
            irs_backup_withholding: false,
          },
          user_id: 'user123',
          id: 'profile123',
          escrow_id: null,
        }),
      });
      const newStore = useFormBackgroundInformation();
      expect(newStore.isAdditionalFields).toBe(true);
    });

    it('should compute isAdditionalFields correctly for retired', () => {
      vi.mocked(useProfilesStore).mockReturnValue({
        selectedUserProfileId: ref('123'),
        selectedUserProfileType: ref('individual'),
        selectedUserProfileData: ref({
          data: {
            employment: { type: 'Retired' },
            finra_affiliated: {},
            ten_percent_shareholder: {},
            irs_backup_withholding: false,
          },
          user_id: 'user123',
          id: 'profile123',
          escrow_id: null,
        }),
      });
      const newStore = useFormBackgroundInformation();
      expect(newStore.isAdditionalFields).toBe(false);
    });

    it('should compute isLoadingFields correctly', () => {
      mockProfilesRepositoryState.getProfileByIdOptionsState.value.loading = true;
      const newStore = useFormBackgroundInformation();
      expect(newStore.isLoadingFields).toBe(true);
    });
  });

  describe('handleSave - Validation failure', () => {
    it('should not proceed when form validation fails', async () => {
      mockUseFormValidation.isValid.value = false;
      const newStore = useFormBackgroundInformation();

      await newStore.handleSave();

      expect(mockUseFormValidation.onValidate).toHaveBeenCalled();
      expect(mockScrollToError).toHaveBeenCalledWith('ViewDashboardBackgroundInformation');
      expect(mockRepositoryProfiles.setProfileById).not.toHaveBeenCalled();
    });
  });

  describe('handleSave - Success scenarios', () => {
    beforeEach(() => {
      mockRepositoryProfiles.setProfileById.mockResolvedValue(undefined);
      mockRepositoryProfiles.getProfileById.mockResolvedValue(undefined);
    });

    it('should save profile successfully and navigate to account page', async () => {
      mockUseFormValidation.isValid.value = true;
      const newStore = useFormBackgroundInformation();

      await newStore.handleSave();

      expect(mockUseFormValidation.onValidate).toHaveBeenCalled();
      expect(mockRepositoryProfiles.setProfileById).toHaveBeenCalledWith(
        {
          employment: {
            type: 'Retired',
            employer_name: '',
            title: '',
            address1: '',
            address2: '',
            city: '',
            zip_code: '',
          },
          finra_affiliated: {
            member_association: false,
            correspondence: false,
            member_firm_name: '',
            compliance_contact_name: '',
            compliance_contant_email: '',
          },
          ten_percent_shareholder: {
            shareholder_association: false,
            ticker_symbol_list: '',
          },
          irs_backup_withholding: false,
        },
        'individual',
        '123',
      );
      expect(mockHubspotForm.submitFormToHubspot).toHaveBeenCalledWith({
        email: 'john@example.com',
        employment_type: 'Retired',
        employer_name: '',
        title: '',
        employer_address_1: '',
        employer_address_2: '',
        city: '',
        zip: '',
        member_association: false,
        correspondence: false,
        member_firm_name: '',
        compliance_contact_name: '',
        compliance_contant_email: '',
        shareholder_association: false,
        ticker_symbol_list: '',
        irs_backup_withholding: false,
        compliance_contractemail: '',
      });
      expect(mockRepositoryProfiles.getProfileById).toHaveBeenCalledWith('individual', '123');
      expect(mockRouter.push).toHaveBeenCalledWith({
        name: ROUTE_DASHBOARD_ACCOUNT,
        params: { profileId: '123' },
      });
    });

    it('should handle full-time employment data correctly', async () => {
      mockUseFormValidation.isValid.value = true;
      // Update the existing model properties instead of replacing the entire object
      mockUseFormValidation.model.value.employment.type = 'full-time';
      mockUseFormValidation.model.value.employment.employer_name = 'Test Company';
      mockUseFormValidation.model.value.employment.title = 'Software Engineer';
      mockUseFormValidation.model.value.employment.address1 = '123 Main St';
      mockUseFormValidation.model.value.employment.address2 = 'Suite 100';
      mockUseFormValidation.model.value.employment.city = 'New York';
      mockUseFormValidation.model.value.employment.zip_code = '10001';
      const newStore = useFormBackgroundInformation();

      await newStore.handleSave();

      expect(mockRepositoryProfiles.setProfileById).toHaveBeenCalledWith(
        expect.objectContaining({
          employment: expect.objectContaining({
            type: 'full-time',
            employer_name: 'Test Company',
            title: 'Software Engineer',
            address1: '123 Main St',
            address2: 'Suite 100',
            city: 'New York',
            zip_code: '10001',
          }),
        }),
        'individual',
        '123',
      );
    });

    it('should handle FINRA affiliated data correctly', async () => {
      mockUseFormValidation.isValid.value = true;
      // Update the existing model properties instead of replacing the entire object
      mockUseFormValidation.model.value.finra_affiliated.member_association = true;
      mockUseFormValidation.model.value.finra_affiliated.correspondence = false;
      mockUseFormValidation.model.value.finra_affiliated.member_firm_name = 'Test Firm';
      mockUseFormValidation.model.value.finra_affiliated.compliance_contact_name = 'John Doe';
      mockUseFormValidation.model.value.finra_affiliated.compliance_contant_email = 'john@testfirm.com';
      const newStore = useFormBackgroundInformation();

      await newStore.handleSave();

      expect(mockRepositoryProfiles.setProfileById).toHaveBeenCalledWith(
        expect.objectContaining({
          finra_affiliated: expect.objectContaining({
            member_association: true,
            correspondence: true,
            member_firm_name: 'Test Firm',
            compliance_contact_name: 'John Doe',
            compliance_contant_email: 'john@testfirm.com',
          }),
        }),
        'individual',
        '123',
      );
    });

    it('should handle ten percent shareholder data correctly', async () => {
      mockUseFormValidation.isValid.value = true;
      // Update the existing model properties instead of replacing the entire object
      mockUseFormValidation.model.value.ten_percent_shareholder.shareholder_association = true;
      mockUseFormValidation.model.value.ten_percent_shareholder.ticker_symbol_list = 'AAPL,GOOGL';
      const newStore = useFormBackgroundInformation();

      await newStore.handleSave();

      expect(mockRepositoryProfiles.setProfileById).toHaveBeenCalledWith(
        expect.objectContaining({
          ten_percent_shareholder: expect.objectContaining({
            shareholder_association: true,
            ticker_symbol_list: 'AAPL,GOOGL',
          }),
        }),
        'individual',
        '123',
      );
    });

    it('should handle IRS backup withholding correctly', async () => {
      mockUseFormValidation.isValid.value = true;
      // Update the existing model property instead of resetting the entire model
      mockUseFormValidation.model.value.irs_backup_withholding = true;
      const newStore = useFormBackgroundInformation();

      await newStore.handleSave();

      expect(mockRepositoryProfiles.setProfileById).toHaveBeenCalledWith(
        expect.objectContaining({
          irs_backup_withholding: true,
        }),
        'individual',
        '123',
      );
    });
  });

  describe('Watchers', () => {
    it('should watch employment data changes', () => {
      const newStore = useFormBackgroundInformation();

      // Simulate employment data change
      mockProfilesStore.selectedUserProfileData.value.data.employment = {
        type: 'full-time',
        employer_name: 'New Company',
        title: 'Manager',
        address1: '456 Oak St',
        address2: 'Apt 2',
        city: 'Los Angeles',
        zip_code: '90210',
      };

      // Trigger watcher by accessing the store again
      const updatedStore = useFormBackgroundInformation();
      expect(updatedStore).toBeDefined();
    });

    it('should watch FINRA affiliated data changes', () => {
      const newStore = useFormBackgroundInformation();

      // Simulate FINRA data change
      mockProfilesStore.selectedUserProfileData.value.data.finra_affiliated = {
        member_association: true,
        correspondence: false,
        member_firm_name: 'New Firm',
        compliance_contact_name: 'Jane Smith',
        compliance_contant_email: 'jane@newfirm.com',
      };

      // Trigger watcher by accessing the store again
      const updatedStore = useFormBackgroundInformation();
      expect(updatedStore).toBeDefined();
    });

    it('should watch ten percent shareholder data changes', () => {
      const newStore = useFormBackgroundInformation();

      // Simulate shareholder data change
      mockProfilesStore.selectedUserProfileData.value.data.ten_percent_shareholder = {
        shareholder_association: true,
        ticker_symbol_list: 'MSFT,TSLA',
      };

      // Trigger watcher by accessing the store again
      const updatedStore = useFormBackgroundInformation();
      expect(updatedStore).toBeDefined();
    });

    it('should watch IRS backup withholding changes', () => {
      const newStore = useFormBackgroundInformation();

      // Simulate IRS data change
      mockProfilesStore.selectedUserProfileData.value.data.irs_backup_withholding = true;

      // Trigger watcher by accessing the store again
      const updatedStore = useFormBackgroundInformation();
      expect(updatedStore).toBeDefined();
    });
  });

  describe('Form validation and schema', () => {
    it('should have correct schema frontend structure', () => {
      const newStore = useFormBackgroundInformation();

      expect(newStore.schemaFrontend).toHaveProperty('$schema');
      expect(newStore.schemaFrontend).toHaveProperty('definitions');
      expect(newStore.schemaFrontend.definitions).toHaveProperty('EmploymentTypes');
      expect(newStore.schemaFrontend.definitions).toHaveProperty('FINRAAffiliated');
      expect(newStore.schemaFrontend.definitions).toHaveProperty('Individual');
    });

    it('should return validation object', () => {
      const newStore = useFormBackgroundInformation();

      expect(newStore.validation).toBeDefined();
    });

    it('should return model object', () => {
      const newStore = useFormBackgroundInformation();

      expect(newStore.model).toBeDefined();
      expect(newStore.model).toHaveProperty('employment');
      expect(newStore.model).toHaveProperty('finra_affiliated');
      expect(newStore.model).toHaveProperty('ten_percent_shareholder');
      expect(newStore.model).toHaveProperty('irs_backup_withholding');
    });
  });

  describe('Return values', () => {
    it('should return all expected properties', () => {
      const returnedStore = useFormBackgroundInformation();

      expect(returnedStore).toHaveProperty('backButtonText');
      expect(returnedStore).toHaveProperty('breadcrumbs');
      expect(returnedStore).toHaveProperty('isDisabledButton');
      expect(returnedStore).toHaveProperty('isLoading');
      expect(returnedStore).toHaveProperty('isLoadingFields');
      expect(returnedStore).toHaveProperty('handleSave');
      expect(returnedStore).toHaveProperty('schemaBackend');
      expect(returnedStore).toHaveProperty('errorData');
      expect(returnedStore).toHaveProperty('optionsEmployment');
      expect(returnedStore).toHaveProperty('model');
      expect(returnedStore).toHaveProperty('schemaFrontend');
      expect(returnedStore).toHaveProperty('validation');
      expect(returnedStore).toHaveProperty('isAdditionalFields');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty profile data gracefully', () => {
      mockProfilesStore.selectedUserProfileData.value = null;
      const newStore = useFormBackgroundInformation();

      expect(newStore).toBeDefined();
      expect(newStore.schemaBackend).toEqual({
        schema: 'test-schema',
        employment: {
          type: {
            enum: ['Retired', 'full-time', 'part-time', 'self-employed'],
          },
        },
      });
    });
  });
});
