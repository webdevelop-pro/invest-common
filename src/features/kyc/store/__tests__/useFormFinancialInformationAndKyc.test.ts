import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';
import { ROUTE_DASHBOARD_ACCOUNT } from 'InvestCommon/domain/config/enums/routes';
import { useFormFinancialInformationAndKyc } from '../useFormFinancialInformationAndKyc';

const mockPush = vi.fn();
const mockRouter = {
  push: mockPush,
};
const mockRoute: { query: Record<string, unknown> } = {
  query: {},
};
vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
  useRoute: () => mockRoute,
}));

const mockProfilesStore = {
  selectedUserProfileId: ref('123'),
  selectedUserProfileType: ref('individual'),
  selectedUserProfileData: ref({
    data: { id: '123', type: 'individual' }, user_id: 'user123', id: 'profile123', escrow_id: null,
  }),
};
vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: vi.fn(() => mockProfilesStore),
}));

const mockRepositoryProfiles = {
  setProfileById: vi.fn(),
  getProfileById: vi.fn(),
  setUser: vi.fn(),
  getUser: vi.fn(),
  setProfileByIdState: ref({ loading: false, error: null, data: undefined }),
  getProfileByIdOptionsState: ref({ loading: false, error: null, data: { schema: {} } }),
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

const mockKycRepository = {
  handlePlaidKyc: vi.fn(),
  tokenState: ref({ error: null }),
};
vi.mock('InvestCommon/data/kyc/kyc.repository', () => ({
  useRepositoryKyc: vi.fn(() => mockKycRepository),
}));

const mockAccreditationRepository = {
  createEscrow: vi.fn(),
};
vi.mock('InvestCommon/data/accreditation/accreditation.repository', () => ({
  useRepositoryAccreditation: vi.fn(() => mockAccreditationRepository),
}));

const mockSubmitFormToHubspot = vi.fn();
vi.mock('UiKit/composables/useHubspotForm', () => ({
  useHubspotForm: vi.fn(() => ({
    submitFormToHubspot: mockSubmitFormToHubspot,
  })),
}));

vi.mock('UiKit/helpers/validation/general', () => ({
  scrollToError: vi.fn(),
}));

vi.mock('InvestCommon/config/env', () => ({
  default: {
    HUBSPOT_FORM_ID_FINANCIAL_SITUATION: 'financial-situation-form-id',
    HUBSPOT_FORM_ID_RISKS: 'risks-form-id',
    HUBSPOT_FORM_ID_INVESTMENT_OBJECTIVES: 'investment-objectives-form-id',
    HUBSPOT_FORM_ID_PERSONAL_INFORMATION: 'personal-information-form-id',
  },
}));

vi.mock('InvestCommon/domain/error/errorReporting', () => ({
  reportError: vi.fn(),
}));

const mockPersonalFormRef = {
  value: {
    isValid: true,
    model: { dob: '1990-01-01', name: 'John Doe' },
    onValidate: vi.fn(),
  },
};
const mockFinancialInfoFormRef = {
  value: {
    isValid: true,
    model: { accredited_investor: { is_accredited: true }, consent_plaid: true },
    onValidate: vi.fn(),
  },
};
const mockInvestmentObjectivesFormRef = {
  value: {
    isValid: true,
    model: { duration: '1 to 3 years', objectives: 'Growth' },
    onValidate: vi.fn(),
  },
};
const mockUnderstandingRisksFormRef = {
  value: {
    isValid: true,
    model: { risk_involved: true, resell_difficulties: true },
    onValidate: vi.fn(),
  },
};

vi.mock('vue', async () => {
  const actual = await vi.importActual('vue');
  return {
    ...actual,
    useTemplateRef: vi.fn((name: string) => {
      switch (name) {
        case 'personalFormChild':
          return mockPersonalFormRef;
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

describe('useFormFinancialInformationAndKyc', () => {
  let composable: ReturnType<typeof useFormFinancialInformationAndKyc>;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockRepositoryProfiles.setProfileByIdState = ref({ loading: false, error: null, data: undefined });
    mockRepositoryProfiles.getProfileByIdOptionsState = ref({ loading: false, error: null, data: { schema: {} } });
    composable = useFormFinancialInformationAndKyc();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('form validation', () => {
    it('should be valid when all forms are valid', () => {
      mockPersonalFormRef.value.isValid = true;
      mockFinancialInfoFormRef.value.isValid = true;
      mockInvestmentObjectivesFormRef.value.isValid = true;
      mockUnderstandingRisksFormRef.value.isValid = true;
      expect(composable.isDisabledButton.value).toBe(false);
    });
    it('should be invalid when any form is invalid', () => {
      mockPersonalFormRef.value.isValid = false;
      expect(composable.isDisabledButton.value).toBe(true);
      mockPersonalFormRef.value.isValid = true;
      mockFinancialInfoFormRef.value.isValid = false;
      expect(composable.isDisabledButton.value).toBe(true);
      mockFinancialInfoFormRef.value.isValid = true;
      mockInvestmentObjectivesFormRef.value.isValid = false;
      expect(composable.isDisabledButton.value).toBe(true);
      mockInvestmentObjectivesFormRef.value.isValid = true;
      mockUnderstandingRisksFormRef.value.isValid = false;
      expect(composable.isDisabledButton.value).toBe(true);
    });
  });

  describe('back navigation', () => {
    it('should expose the dashboard route by default', () => {
      expect(composable.backButtonRoute.value).toEqual({
        name: ROUTE_DASHBOARD_ACCOUNT,
        params: { profileId: '123' },
      });
      expect(composable.breadcrumbs.value[0]?.to).toEqual(composable.backButtonRoute.value);
    });

    it('should expose the redirect query as the back route when present', () => {
      mockRoute.query = { redirect: '/profile/123/wallet?wallet-tab=holdings' };
      composable = useFormFinancialInformationAndKyc();

      expect(composable.backButtonRoute.value).toBe('/profile/123/wallet?wallet-tab=holdings');
      expect(composable.breadcrumbs.value[0]?.to).toBe('/profile/123/wallet?wallet-tab=holdings');
    });
  });

  describe('handleSave', () => {
    beforeEach(() => {
      mockPersonalFormRef.value.isValid = true;
      mockFinancialInfoFormRef.value.isValid = true;
      mockInvestmentObjectivesFormRef.value.isValid = true;
      mockUnderstandingRisksFormRef.value.isValid = true;
      mockRepositoryProfiles.setProfileById.mockResolvedValue({});
      mockRepositoryProfiles.getProfileById.mockResolvedValue({});
      mockKycRepository.handlePlaidKyc.mockResolvedValue({ success: true });
      mockAccreditationRepository.createEscrow.mockResolvedValue({});
    });

    it('should save successfully when all forms are valid', async () => {
      mockRoute.query = {};
      composable = useFormFinancialInformationAndKyc();
      await composable.handleSave();
      expect(mockPersonalFormRef.value.onValidate).toHaveBeenCalled();
      expect(mockFinancialInfoFormRef.value.onValidate).toHaveBeenCalled();
      expect(mockInvestmentObjectivesFormRef.value.onValidate).toHaveBeenCalled();
      expect(mockUnderstandingRisksFormRef.value.onValidate).toHaveBeenCalled();
      const { consent_plaid, ...expectedFields } = {
        ...mockPersonalFormRef.value.model,
        ...mockFinancialInfoFormRef.value.model,
        ...mockInvestmentObjectivesFormRef.value.model,
        ...mockUnderstandingRisksFormRef.value.model,
      };
      expect(mockRepositoryProfiles.setProfileById).toHaveBeenCalledWith(
        expect.objectContaining(expectedFields),
        'individual',
        '123',
      );
      expect(mockRepositoryProfiles.setUser).toHaveBeenCalledWith({ phone: undefined });
      expect(mockRepositoryProfiles.getUser).toHaveBeenCalled();
      expect(mockRepositoryProfiles.setUser.mock.invocationCallOrder[0]).toBeLessThan(
        mockRepositoryProfiles.getUser.mock.invocationCallOrder[0],
      );
      expect(mockKycRepository.handlePlaidKyc).toHaveBeenCalled();
      expect(mockAccreditationRepository.createEscrow).toHaveBeenCalledWith('user123', 'profile123');
      expect(mockSubmitFormToHubspot).toHaveBeenCalledTimes(4);
      expect(mockRepositoryProfiles.getProfileById).toHaveBeenCalledWith('individual', '123');
      expect(mockPush).toHaveBeenCalledWith(composable.backButtonRoute.value);
      expect(composable.isLoading.value).toBe(false);
    });

    it('should redirect back when redirect query param is present', async () => {
      mockRoute.query = { redirect: '/profile/123/wallet?wallet-tab=holdings' };
      composable = useFormFinancialInformationAndKyc();
      await composable.handleSave();
      expect(mockPush).toHaveBeenCalledWith(composable.backButtonRoute.value);
    });

    it('should not save and should scroll to error if any form is invalid', async () => {
      mockPersonalFormRef.value.isValid = false;
      await composable.handleSave();
      expect(mockPersonalFormRef.value.onValidate).toHaveBeenCalled();
      expect(mockFinancialInfoFormRef.value.onValidate).toHaveBeenCalled();
      expect(mockInvestmentObjectivesFormRef.value.onValidate).toHaveBeenCalled();
      expect(mockUnderstandingRisksFormRef.value.onValidate).toHaveBeenCalled();
      expect(mockRepositoryProfiles.setProfileById).not.toHaveBeenCalled();
      expect(composable.isLoading.value).toBe(false);
    });

    it('should handle setProfileById error gracefully', async () => {
      mockRepositoryProfiles.setProfileById.mockRejectedValue(new Error('fail'));
      const { reportError } = await import('InvestCommon/domain/error/errorReporting');

      await composable.handleSave();

      expect(mockRepositoryProfiles.setProfileById).toHaveBeenCalled();
      expect(reportError).toHaveBeenCalledWith(
        expect.any(Error),
        'Failed to save KYC and financial information',
      );
      expect(mockRepositoryProfiles.setUser).not.toHaveBeenCalled();
      expect(mockRepositoryProfiles.getUser).not.toHaveBeenCalled();
      expect(composable.isLoading.value).toBe(false);
    });

    it('should report Plaid KYC error with the correct message', async () => {
      mockKycRepository.handlePlaidKyc.mockRejectedValue(new Error('kyc fail'));
      const { reportError } = await import('InvestCommon/domain/error/errorReporting');

      await composable.handleSave();

      expect(mockKycRepository.handlePlaidKyc).toHaveBeenCalled();
      expect(reportError).toHaveBeenCalledWith(
        expect.any(Error),
        'Failed to handle Plaid KYC',
      );
      expect(mockRepositoryProfiles.setUser).toHaveBeenCalledWith({ phone: undefined });
      expect(mockRepositoryProfiles.getUser).toHaveBeenCalled();
      expect(mockRepositoryProfiles.setUser.mock.invocationCallOrder[0]).toBeLessThan(
        mockRepositoryProfiles.getUser.mock.invocationCallOrder[0],
      );
      expect(mockAccreditationRepository.createEscrow).not.toHaveBeenCalled();
      expect(composable.isLoading.value).toBe(false);
    });

    it('should continue with escrow creation and redirect when Plaid closes without throwing', async () => {
      mockKycRepository.handlePlaidKyc.mockResolvedValue({ success: false });

      await composable.handleSave();

      expect(mockKycRepository.handlePlaidKyc).toHaveBeenCalledWith('123');
      expect(mockAccreditationRepository.createEscrow).toHaveBeenCalledWith('user123', 'profile123');
      expect(mockRepositoryProfiles.getProfileById).toHaveBeenCalledWith('individual', '123');
      expect(mockPush).toHaveBeenCalledWith(composable.backButtonRoute.value);
      expect(composable.isLoading.value).toBe(false);
    });

    it('should still wait for hubspot before redirecting when Plaid is closed', async () => {
      let resolveHubspotRequest!: () => void;
      mockKycRepository.handlePlaidKyc.mockResolvedValue({ success: false });
      mockSubmitFormToHubspot
        .mockImplementationOnce(() => new Promise<void>((resolve) => {
          resolveHubspotRequest = resolve;
        }))
        .mockResolvedValue(undefined);

      const savePromise = composable.handleSave();

      await vi.waitFor(() => {
        expect(mockKycRepository.handlePlaidKyc).toHaveBeenCalledWith('123');
        expect(mockAccreditationRepository.createEscrow).toHaveBeenCalledWith('user123', 'profile123');
        expect(mockRepositoryProfiles.getProfileById).toHaveBeenCalledWith('individual', '123');
      });
      expect(mockPush).not.toHaveBeenCalled();

      resolveHubspotRequest();
      await savePromise;

      expect(mockPush).toHaveBeenCalledWith(composable.backButtonRoute.value);
    });

    it('should not wait for user sync after profile save', async () => {
      mockRepositoryProfiles.setUser.mockImplementation(() => new Promise(() => {}));

      await composable.handleSave();

      expect(mockRepositoryProfiles.setUser).toHaveBeenCalledWith({ phone: undefined });
      expect(mockRepositoryProfiles.getUser).not.toHaveBeenCalled();
      expect(mockKycRepository.handlePlaidKyc).toHaveBeenCalled();
      expect(mockAccreditationRepository.createEscrow).toHaveBeenCalledWith('user123', 'profile123');
      expect(mockSubmitFormToHubspot).toHaveBeenCalledTimes(4);
      expect(mockPush).toHaveBeenCalledWith(composable.backButtonRoute.value);
      expect(composable.isLoading.value).toBe(false);
    });

    it('should wait for hubspot before routing without blocking the main save flow', async () => {
      let resolveHubspotRequest!: () => void;
      mockSubmitFormToHubspot
        .mockImplementationOnce(() => new Promise<void>((resolve) => {
          resolveHubspotRequest = resolve;
        }))
        .mockResolvedValue(undefined);

      const savePromise = composable.handleSave();

      await vi.waitFor(() => {
        expect(mockKycRepository.handlePlaidKyc).toHaveBeenCalled();
        expect(mockAccreditationRepository.createEscrow).toHaveBeenCalledWith('user123', 'profile123');
      });
      expect(mockPush).not.toHaveBeenCalled();

      resolveHubspotRequest();
      await savePromise;

      expect(mockPush).toHaveBeenCalledWith(composable.backButtonRoute.value);
    });

    it('should report escrow creation error with the correct message', async () => {
      mockAccreditationRepository.createEscrow.mockRejectedValue(new Error('escrow fail'));
      const { reportError } = await import('InvestCommon/domain/error/errorReporting');

      await composable.handleSave();

      expect(mockAccreditationRepository.createEscrow).toHaveBeenCalledWith('user123', 'profile123');
      expect(reportError).toHaveBeenCalledWith(
        expect.any(Error),
        'Failed to create escrow',
      );
      expect(mockRepositoryProfiles.getProfileById).toHaveBeenCalledWith('individual', '123');
      expect(mockSubmitFormToHubspot).toHaveBeenCalledTimes(4);
      expect(mockPush).toHaveBeenCalledWith(composable.backButtonRoute.value);
      expect(composable.isLoading.value).toBe(false);
    });

    it('should handle KYC and Escrow creation only if no errors', async () => {
      mockRepositoryProfiles.setProfileByIdState.value.error = null;
      mockKycRepository.tokenState = ref({ error: null });
      mockProfilesStore.selectedUserProfileData.value = {
        data: { id: 'profile123', type: 'individual' }, user_id: 'user123', id: 'profile123', escrow_id: null,
      };
      await composable.handleSave();
      expect(mockKycRepository.handlePlaidKyc).toHaveBeenCalled();
      expect(mockAccreditationRepository.createEscrow).toHaveBeenCalledWith('user123', 'profile123');
    });

    it('should not create escrow if escrow_id exists', async () => {
      mockProfilesStore.selectedUserProfileData.value = {
        data: { id: 'profile123', type: 'individual' }, user_id: 'user123', id: 'profile123', escrow_id: 'escrow123' as any,
      };
      await composable.handleSave();
      expect(mockAccreditationRepository.createEscrow).not.toHaveBeenCalled();
    });

    it('should not call hubspotHandle if setProfileByIdState has error', async () => {
      mockRepositoryProfiles.setProfileByIdState.value.error = { data: { responseJson: 'error' } } as any;
      await composable.handleSave();
      expect(mockSubmitFormToHubspot).not.toHaveBeenCalled();
    });
  });
});
