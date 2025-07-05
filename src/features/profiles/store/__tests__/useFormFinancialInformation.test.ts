import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { nextTick, ref, computed } from 'vue';
import { useFormBackgroundInformation } from '../useFormFinancialInformation';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryAccreditation } from 'InvestCommon/data/accreditation/accreditation.repository';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/helpers/enums/routes';


const mockPush = vi.fn();
const mockRouter = {
  push: mockPush,
};
vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
}));


const mockProfilesStore = {
  selectedUserProfileId: ref('123'),
  selectedUserProfileType: ref('individual'),
  selectedUserProfileData: ref({ data: { id: '123', type: 'individual' } }),
};
vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: vi.fn(() => mockProfilesStore),
}));

const mockRepositoryProfiles = {
  setProfileById: vi.fn(),
  getProfileById: vi.fn(),
  setProfileByIdState: { value: { loading: false, error: null, data: undefined } },
  getProfileByIdOptionsState: { value: { loading: false, error: null, data: { schema: {} } } },
};
vi.mock('InvestCommon/data/profiles/profiles.repository', () => ({
  useRepositoryProfiles: vi.fn(() => mockRepositoryProfiles),
}));

const mockSessionStore = {
  userSessionTraits: ref({ email: 'test@example.com' }),
};
vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: vi.fn(() => mockSessionStore),
}));

const mockAccreditationRepository = {
  createEscrow: vi.fn(),
};
vi.mock('InvestCommon/data/accreditation/accreditation.repository', () => ({
  useRepositoryAccreditation: vi.fn(() => mockAccreditationRepository),
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
    HUBSPOT_FORM_ID_FINANCIAL_SITUATION: 'financial-situation-form-id',
    HUBSPOT_FORM_ID_RISKS: 'risks-form-id',
    HUBSPOT_FORM_ID_INVESTMENT_OBJECTIVES: 'investment-objectives-form-id',
  },
}));


const mockFinancialInfoFormRef = {
  value: {
    isValid: true,
    model: {
      accredited_investor: { is_accredited: true },
      consent_plaid: true,
    },
    onValidate: vi.fn(),
  },
};

const mockInvestmentObjectivesFormRef = {
  value: {
    isValid: true,
    model: {
      duration: '1 to 3 years',
      objectives: 'Growth',
    },
    onValidate: vi.fn(),
  },
};

const mockUnderstandingRisksFormRef = {
  value: {
    isValid: true,
    model: {
      risk_involved: true,
      resell_difficulties: true,
    },
    onValidate: vi.fn(),
  },
};


vi.mock('vue', async () => {
  const actual = await vi.importActual('vue');
  return {
    ...actual,
    useTemplateRef: vi.fn((name: string) => {
      switch (name) {
        case 'financialInfoFormChild':
          return mockFinancialInfoFormRef;
        case 'investmentObjectivesFormChild':
          return mockInvestmentObjectivesFormRef;
        case 'understandingRisksFormChild':
          return mockUnderstandingRisksFormRef;
        default:
          return { value: null };
      }
    }),
  };
});

describe('useFormFinancialInformation', () => {
  let store: ReturnType<typeof useFormBackgroundInformation>;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    store = useFormBackgroundInformation();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      expect(store.backButtonText).toBe('Back to Profile Details');
      expect(store.isLoading).toBe(false);
      expect(store.isDisabledButton).toBe(false);
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
          text: 'Financial and Investment Information',
        },
      ]);
    });
  });

  describe('form validation', () => {
    it('should be valid when all forms are valid', () => {
      mockFinancialInfoFormRef.value.isValid = true;
      mockInvestmentObjectivesFormRef.value.isValid = true;
      mockUnderstandingRisksFormRef.value.isValid = true;

      expect(store.isDisabledButton).toBe(false);
    });

    it('should be invalid when financial info form is invalid', () => {
      mockFinancialInfoFormRef.value.isValid = false;
      mockInvestmentObjectivesFormRef.value.isValid = true;
      mockUnderstandingRisksFormRef.value.isValid = true;

      expect(store.isDisabledButton).toBe(true);
    });

    it('should be invalid when investment objectives form is invalid', () => {
      mockFinancialInfoFormRef.value.isValid = true;
      mockInvestmentObjectivesFormRef.value.isValid = false;
      mockUnderstandingRisksFormRef.value.isValid = true;

      expect(store.isDisabledButton).toBe(true);
    });

    it('should be invalid when understanding risks form is invalid', () => {
      mockFinancialInfoFormRef.value.isValid = true;
      mockInvestmentObjectivesFormRef.value.isValid = true;
      mockUnderstandingRisksFormRef.value.isValid = false;

      expect(store.isDisabledButton).toBe(true);
    });

    it('should be invalid when multiple forms are invalid', () => {
      mockFinancialInfoFormRef.value.isValid = false;
      mockInvestmentObjectivesFormRef.value.isValid = false;
      mockUnderstandingRisksFormRef.value.isValid = true;

      expect(store.isDisabledButton).toBe(true);
    });
  });

  describe('handleSave - success scenarios', () => {
    beforeEach(() => {
      mockFinancialInfoFormRef.value.isValid = true;
      mockInvestmentObjectivesFormRef.value.isValid = true;
      mockUnderstandingRisksFormRef.value.isValid = true;
      mockRepositoryProfiles.setProfileById.mockResolvedValue({});
      mockRepositoryProfiles.getProfileById.mockResolvedValue({});
    });

    it('should save successfully when all forms are valid', async () => {
      await store.handleSave();

      expect(mockFinancialInfoFormRef.value.onValidate).toHaveBeenCalled();
      expect(mockInvestmentObjectivesFormRef.value.onValidate).toHaveBeenCalled();
      expect(mockUnderstandingRisksFormRef.value.onValidate).toHaveBeenCalled();
      expect(mockRepositoryProfiles.setProfileById).toHaveBeenCalledWith(
        {
          accredited_investor: { is_accredited: true },
          duration: '1 to 3 years',
          objectives: 'Growth',
          risk_involved: true,
          resell_difficulties: true,
        },
        'individual',
        '123',
      );
      expect(mockRepositoryProfiles.getProfileById).toHaveBeenCalledWith('individual', '123');
      expect(mockPush).toHaveBeenCalledWith({
        name: ROUTE_DASHBOARD_ACCOUNT,
        params: { profileId: '123' },
      });
      expect(store.isLoading).toBe(false);
    });

    it('should submit hubspot forms with correct data', async () => {
      await store.handleSave();

      expect(mockSubmitFormToHubspot).toHaveBeenCalledTimes(3);
      
      expect(mockSubmitFormToHubspot).toHaveBeenCalledWith({
        email: 'test@example.com',
        is_accredited: true,
      });
      expect(mockSubmitFormToHubspot).toHaveBeenCalledWith({
        email: 'test@example.com',
        risk_involved: true,
        resell_difficulties: true,
      });
      expect(mockSubmitFormToHubspot).toHaveBeenCalledWith({
        email: 'test@example.com',
        duration: '1 to 3 years',
        objectives: 'Growth',
      });
    });
  });

  describe('handleSave - validation failure scenarios', () => {
    beforeEach(() => {
      mockFinancialInfoFormRef.value.isValid = false;
      mockInvestmentObjectivesFormRef.value.isValid = true;
      mockUnderstandingRisksFormRef.value.isValid = true;
    });

    it('should not save when forms are invalid', async () => {
      await store.handleSave();

      expect(mockFinancialInfoFormRef.value.onValidate).toHaveBeenCalled();
      expect(mockInvestmentObjectivesFormRef.value.onValidate).toHaveBeenCalled();
      expect(mockUnderstandingRisksFormRef.value.onValidate).toHaveBeenCalled();
      expect(mockRepositoryProfiles.setProfileById).not.toHaveBeenCalled();
      expect(mockRepositoryProfiles.getProfileById).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
      expect(scrollToError).toHaveBeenCalledWith('ViewDashboardFinancialInformation');
    });

    it('should not submit hubspot forms when validation fails', async () => {
      await store.handleSave();

      expect(mockSubmitFormToHubspot).not.toHaveBeenCalled();
    });
  });

  describe('handleSave - error scenarios', () => {
    beforeEach(() => {
      mockFinancialInfoFormRef.value.isValid = true;
      mockInvestmentObjectivesFormRef.value.isValid = true;
      mockUnderstandingRisksFormRef.value.isValid = true;
    });

    it('should handle setProfileById error', async () => {
      const mockError = new Error('Profile update failed');
      mockRepositoryProfiles.setProfileById.mockRejectedValue(mockError);

      try {
        await store.handleSave();
      } catch (e) {
      }

      expect(mockRepositoryProfiles.setProfileById).toHaveBeenCalled();
      expect(mockRepositoryProfiles.getProfileById).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
      expect(store.isLoading).toBe(false);
    });

    it('should handle getProfileById error', async () => {
      const mockError = new Error('Profile fetch failed');
      mockRepositoryProfiles.setProfileById.mockResolvedValue({});
      mockRepositoryProfiles.getProfileById.mockRejectedValue(mockError);

      try {
        await store.handleSave();
      } catch (e) {
      }

      expect(mockRepositoryProfiles.setProfileById).toHaveBeenCalled();
      expect(mockRepositoryProfiles.getProfileById).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalled();
      expect(store.isLoading).toBe(false);
    });

    it('should ensure loading state is false even when errors occur', async () => {
      const mockError = new Error('Profile update failed');
      mockRepositoryProfiles.setProfileById.mockRejectedValue(mockError);

      try {
        await store.handleSave();
      } catch (e) {
      }

      expect(store.isLoading).toBe(false);
    });
  });

  describe('form ref interactions', () => {
    it('should call onValidate on all form refs during save', async () => {
      mockFinancialInfoFormRef.value.isValid = true;
      mockInvestmentObjectivesFormRef.value.isValid = true;
      mockUnderstandingRisksFormRef.value.isValid = true;
      mockRepositoryProfiles.setProfileById.mockResolvedValue({});
      mockRepositoryProfiles.getProfileById.mockResolvedValue({});

      await store.handleSave();

      expect(mockFinancialInfoFormRef.value.onValidate).toHaveBeenCalled();
      expect(mockInvestmentObjectivesFormRef.value.onValidate).toHaveBeenCalled();
      expect(mockUnderstandingRisksFormRef.value.onValidate).toHaveBeenCalled();
    });
  });
}); 