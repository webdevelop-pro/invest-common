import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref, nextTick, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { useFormValidation } from 'InvestCommon/composable/useFormValidation';
import { getOptions } from 'UiKit/helpers/model';
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

const selectedUserProfileId = ref('123');
const selectedUserProfileType = ref('individual');
const selectedUserProfileData = ref({
  data: {
    employment: {
      type: 'full-time',
      employer_name: 'Acme Corp',
      title: 'Engineer',
      address1: '123 Main St',
      address2: 'Apt 4',
      city: 'Metropolis',
      zip_code: '12345',
    },
    finra_affiliated: {
      member_association: true,
      correspondence: true,
      member_firm_name: 'FinraFirm',
      compliance_contact_name: 'Jane Compliance',
      compliance_contant_email: 'compliance@finra.com',
    },
    ten_percent_shareholder: {
      shareholder_association: true,
      ticker_symbol_list: 'AAPL,GOOG',
    },
    irs_backup_withholding: true,
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

const mockSetProfileById = vi.fn();
const mockGetProfileById = vi.fn();
const setProfileByIdState = ref({ error: null });
const getProfileByIdOptionsState = ref({
  data: {
    employment: {},
    finra_affiliated: {},
    ten_percent_shareholder: {},
    irs_backup_withholding: {},
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
  useSessionStore: vi.fn(() => ({ userSessionTraits })),
}));

const isValid = ref(false);
const model = reactive({
  employment: {
    type: 'full-time',
    employer_name: 'Acme Corp',
    title: 'Engineer',
    address1: '123 Main St',
    address2: 'Apt 4',
    city: 'Metropolis',
    zip_code: '12345',
  },
  finra_affiliated: {
    member_association: true,
    correspondence: true,
    member_firm_name: 'FinraFirm',
    compliance_contact_name: 'Jane Compliance',
    compliance_contant_email: 'compliance@finra.com',
  },
  ten_percent_shareholder: {
    shareholder_association: true,
    ticker_symbol_list: 'AAPL,GOOG',
  },
  irs_backup_withholding: true,
});
const validation = ref({});
const mockOnValidate = vi.fn();
vi.mock('InvestCommon/composable/useFormValidation', () => ({
  useFormValidation: vi.fn(() => ({
    model,
    validation,
    isValid,
    onValidate: mockOnValidate,
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
  getFilteredObject: vi.fn(() => ({})),
}));

vi.mock('UiKit/helpers/model', () => ({
  getOptions: vi.fn(() => []),
}));

vi.mock('InvestCommon/global', () => ({
  default: {
    HUBSPOT_FORM_ID_BACKGROUND_INFORMATION: 'test-hubspot-form-id',
  },
}));

vi.mock('InvestCommon/helpers/general', () => ({
  checkObjectAndDeleteNotRequiredFields: vi.fn((keep, required, obj) => obj),
}));

vi.mock('ajv/dist/types/json-schema', () => ({
  JSONSchemaType: vi.fn(),
}));

describe('useFormBackgroundInformation', () => {
  let store: ReturnType<typeof useFormBackgroundInformation>;
  let mockRouter: any;
  let mockHubspotForm: any;
  let mockScrollToError: any;

  beforeEach(() => {
    setActivePinia(createPinia());
    mockRouter = vi.mocked(useRouter)();
    mockHubspotForm = vi.mocked(useHubspotForm)();
    mockScrollToError = vi.mocked(scrollToError);
    vi.clearAllMocks();
    store = useFormBackgroundInformation();
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
        { text: 'Dashboard', to: { name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: '123' } } },
        { text: 'Profile Details', to: { name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: '123' } } },
        { text: 'Your Background Information' },
      ]);
    });
    it('should compute isDisabledButton based on isValid', () => {
      isValid.value = false;
      expect(store.isDisabledButton).toBe(true);
      isValid.value = true;
      expect(store.isDisabledButton).toBe(false);
    });
    it('should compute isAdditionalFields correctly', () => {
      model.employment.type = 'full-time';
      expect(store.isAdditionalFields).toBe(true);
      model.employment.type = 'Retired';
      expect(store.isAdditionalFields).toBe(false);
    });
  });

  describe('handleSave', () => {
    it('should not proceed if form is invalid', async () => {
      isValid.value = false;
      await store.handleSave();
      expect(mockOnValidate).toHaveBeenCalled();
      expect(mockScrollToError).toHaveBeenCalledWith('ViewDashboardBackgroundInformation');
      expect(mockSetProfileById).not.toHaveBeenCalled();
      expect(mockSubmitFormToHubspot).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
    it('should save profile and submit to Hubspot and navigate on success', async () => {
      isValid.value = true;
      mockSetProfileById.mockResolvedValue(undefined);
      mockGetProfileById.mockResolvedValue(undefined);
      await store.handleSave();
      expect(mockOnValidate).toHaveBeenCalled();
      expect(mockSetProfileById).toHaveBeenCalledWith(
        {
          employment: { ...model.employment, type: model.employment.type },
          finra_affiliated: model.finra_affiliated,
          ten_percent_shareholder: model.ten_percent_shareholder,
          irs_backup_withholding: model.irs_backup_withholding,
        },
        'individual',
        '123',
      );
      expect(mockSubmitFormToHubspot).toHaveBeenCalledWith(expect.objectContaining({
        email: 'john@example.com',
        employment_type: model.employment.type,
        employer_name: model.employment.employer_name,
        title: model.employment.title,
        employer_address_1: model.employment.address1,
        employer_address_2: model.employment.address2,
        city: model.employment.city,
        zip: model.employment.zip_code,
        ...model.finra_affiliated,
        ...model.ten_percent_shareholder,
        irs_backup_withholding: model.irs_backup_withholding,
        compliance_contractemail: model.finra_affiliated.compliance_contant_email,
      }));
      expect(mockGetProfileById).toHaveBeenCalledWith('individual', '123');
      expect(mockRouter.push).toHaveBeenCalledWith({ name: ROUTE_DASHBOARD_ACCOUNT, params: { profileId: '123' } });
    });
    it('should set isLoading to false even if setProfileById throws', async () => {
      isValid.value = true;
      mockSetProfileById.mockRejectedValue(new Error('API Error'));
      try {
        await store.handleSave();
      } catch (e) {
        // Suppress error for test
      }
      expect(store.isLoading).toBe(false);
    });
  });

  describe('Model synchronization', () => {
    it('should update model.employment when selectedUserProfileData.data.employment changes', async () => {
      selectedUserProfileData.value.data.employment = {
        type: 'part-time',
        employer_name: 'New Corp',
        title: 'Manager',
        address1: '456 Side St',
        address2: 'Suite 2',
        city: 'Gotham',
        zip_code: '54321',
      };
      await nextTick();
      expect(model.employment.type).toBe('part-time');
      expect(model.employment.employer_name).toBe('New Corp');
      expect(model.employment.title).toBe('Manager');
      expect(model.employment.address1).toBe('456 Side St');
      expect(model.employment.address2).toBe('Suite 2');
      expect(model.employment.city).toBe('Gotham');
      expect(model.employment.zip_code).toBe('54321');
    });
    it('should update model.finra_affiliated when selectedUserProfileData.data.finra_affiliated changes', async () => {
      selectedUserProfileData.value.data.finra_affiliated = {
        member_association: true,
        correspondence: true,
        member_firm_name: 'OtherFirm',
        compliance_contact_name: 'Other Name',
        compliance_contant_email: 'other@firm.com',
      };
      await nextTick();
      expect(model.finra_affiliated.member_association).toBe(true);
      expect(model.finra_affiliated.correspondence).toBe(true);
      expect(model.finra_affiliated.member_firm_name).toBe('OtherFirm');
      expect(model.finra_affiliated.compliance_contact_name).toBe('Other Name');
      expect(model.finra_affiliated.compliance_contant_email).toBe('other@firm.com');
    });
    it('should update model.ten_percent_shareholder when selectedUserProfileData.data.ten_percent_shareholder changes', async () => {
      selectedUserProfileData.value.data.ten_percent_shareholder = {
        shareholder_association: true,
        ticker_symbol_list: 'MSFT',
      };
      await nextTick();
      expect(model.ten_percent_shareholder.shareholder_association).toBe(true);
      expect(model.ten_percent_shareholder.ticker_symbol_list).toBe('MSFT');
    });
    it('should update model.irs_backup_withholding when selectedUserProfileData.data.irs_backup_withholding changes', async () => {
      selectedUserProfileData.value.data.irs_backup_withholding = false;
      await nextTick();
      expect(model.irs_backup_withholding).toBe(false);
    });
  });

  describe('Return values', () => {
    it('should return all expected properties', () => {
      expect(store).toHaveProperty('backButtonText');
      expect(store).toHaveProperty('breadcrumbs');
      expect(store).toHaveProperty('isDisabledButton');
      expect(store).toHaveProperty('isLoading');
      expect(store).toHaveProperty('isLoadingFields');
      expect(store).toHaveProperty('handleSave');
      expect(store).toHaveProperty('schemaBackend');
      expect(store).toHaveProperty('errorData');
      expect(store).toHaveProperty('optionsEmployment');
      expect(store).toHaveProperty('model');
      expect(store).toHaveProperty('schemaFrontend');
      expect(store).toHaveProperty('validation');
      expect(store).toHaveProperty('isAdditionalFields');
    });
  });
}); 