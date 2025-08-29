import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { IInvestmentFormatted } from 'InvestCommon/data/investment/investment.types';
import { ROUTE_DASHBOARD_PORTFOLIO } from 'InvestCommon/domain/config/enums/routes';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useHubspotForm } from 'UiKit/composables/useHubspotForm';
// @ts-ignore - path alias resolved by Vite/Vitest config
import { useFormValidation } from 'UiKit/helpers/validation/useFormValidation';
import { usePortfolioCancelInvestment } from '../usePortfolioCancelInvestment';

// Mock dependencies
vi.mock('vue-router', () => ({ useRouter: vi.fn() }));
vi.mock('InvestCommon/data/investment/investment.repository', () => ({ useRepositoryInvestment: vi.fn() }));
vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({ useProfilesStore: vi.fn() }));
vi.mock('InvestCommon/domain/session/store/useSession', () => ({ useSessionStore: vi.fn() }));
vi.mock('UiKit/composables/useHubspotForm', () => ({ useHubspotForm: vi.fn() }));
vi.mock('UiKit/helpers/validation/useFormValidation', () => ({ useFormValidation: vi.fn() }));
// no direct mock for general scrollToError; we use the one provided by useFormValidation

describe('usePortfolioCancelInvestment', () => {
  let mockRouter: any;
  let mockInvestmentRepository: any;
  let mockProfilesStore: any;
  let mockSessionStore: any;
  let mockHubspotForm: any;
  let mockFormValidation: any;
  let mockEmit: any;
  let mockOpen: any;
  let mockInvestment: IInvestmentFormatted;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    // Setup mocks
    mockRouter = { push: vi.fn() };
    (useRouter as any).mockReturnValue(mockRouter);

    mockInvestmentRepository = {
      cancelInvest: vi.fn(),
      cancelInvestState: ref({ loading: false, error: null, data: null }),
      setCancelOptionsState: ref({ loading: false, error: null, data: null }),
      setCancelOptions: vi.fn(),
    };
    (vi.mocked(useRepositoryInvestment) as any).mockReturnValue(mockInvestmentRepository);

    mockProfilesStore = { selectedUserProfileId: ref(123) };
    (vi.mocked(useProfilesStore) as any).mockReturnValue(mockProfilesStore);

    mockSessionStore = { userSessionTraits: ref({ email: 'test@example.com' }) };
    (vi.mocked(useSessionStore) as any).mockReturnValue(mockSessionStore);

    mockHubspotForm = { submitFormToHubspot: vi.fn() };
    (vi.mocked(useHubspotForm) as any).mockReturnValue(mockHubspotForm);

    mockFormValidation = {
      model: { cancelation_reason: '' },
      validation: ref({}),
      isValid: ref(false),
      onValidate: vi.fn(),
      scrollToError: vi.fn(),
    };
    (vi.mocked(useFormValidation) as any).mockReturnValue(mockFormValidation);

    mockEmit = vi.fn();
    mockOpen = ref(false);
    mockInvestment = { id: 456, offer: { name: 'Test Offer', id: 789 } } as IInvestmentFormatted;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Button State', () => {
    it('should disable button when form is invalid or loading', () => {
      // Test invalid form
      mockFormValidation.isValid.value = false;
      let composable = usePortfolioCancelInvestment(mockInvestment, mockOpen, mockEmit);
      expect(composable.isBtnDisabled.value).toBe(true);

      // Test loading state
      mockFormValidation.isValid.value = true;
      mockInvestmentRepository.cancelInvestState.value.loading = true;
      composable = usePortfolioCancelInvestment(mockInvestment, mockOpen, mockEmit);
      expect(composable.isBtnDisabled.value).toBe(true);

      // Test valid and not loading
      mockInvestmentRepository.cancelInvestState.value.loading = false;
      composable = usePortfolioCancelInvestment(mockInvestment, mockOpen, mockEmit);
      expect(composable.isBtnDisabled.value).toBe(false);
    });
  });

  describe('cancelInvestHandler', () => {
    it('should validate form and scroll to error when invalid', async () => {
      mockFormValidation.isValid.value = false;
      mockFormValidation.onValidate.mockImplementation(() => {
        mockFormValidation.isValid.value = false;
      });

      const composable = usePortfolioCancelInvestment(mockInvestment, mockOpen, mockEmit);
      await composable.cancelInvestHandler();

      expect(mockFormValidation.onValidate).toHaveBeenCalled();
      expect(mockFormValidation.scrollToError).toHaveBeenCalledWith('VDialogPortfolioCancelInvestment');
      expect(mockInvestmentRepository.cancelInvest).not.toHaveBeenCalled();
    });

    it('should proceed with cancellation and submit to hubspot on success', async () => {
      mockFormValidation.isValid.value = true;
      mockFormValidation.model.cancelation_reason = 'Test reason';
      mockInvestmentRepository.cancelInvest.mockResolvedValue(undefined);

      const composable = usePortfolioCancelInvestment(mockInvestment, mockOpen, mockEmit);
      await composable.cancelInvestHandler();

      expect(mockInvestmentRepository.cancelInvest).toHaveBeenCalledWith('456', 'Test reason');
      expect(mockHubspotForm.submitFormToHubspot).toHaveBeenCalledWith({
        email: 'test@example.com',
        cancellation_reason: 'Test reason',
        cancellation_offer_name: 'Test Offer',
        cancellation_offer_id: 456,
      });
      expect(mockEmit).toHaveBeenCalledWith('close');
      expect(mockRouter.push).toHaveBeenCalledWith({
        name: ROUTE_DASHBOARD_PORTFOLIO,
        params: { profileId: 123 },
      });
    });

    it('should not submit to hubspot or navigate when API error occurs', async () => {
      mockFormValidation.isValid.value = true;
      mockFormValidation.model.cancelation_reason = 'Test reason';
      mockInvestmentRepository.cancelInvestState.value.error = {
        data: { responseJson: { message: 'API Error' } },
      };

      const composable = usePortfolioCancelInvestment(mockInvestment, mockOpen, mockEmit);
      await composable.cancelInvestHandler();

      expect(mockHubspotForm.submitFormToHubspot).not.toHaveBeenCalled();
      expect(mockEmit).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should expose error data for UI display', () => {
      const errorData = { message: 'API Error' };
      mockInvestmentRepository.setCancelOptionsState.value.error = {
        data: { responseJson: errorData },
      };

      const composable = usePortfolioCancelInvestment(mockInvestment, mockOpen, mockEmit);
      expect(composable.errorData.value).toEqual(errorData);
    });
  });

  describe('Open watcher', () => {
    it('should fetch cancel options when dialog opens and schema is empty', async () => {
      const composable = usePortfolioCancelInvestment(mockInvestment, mockOpen, mockEmit);
      mockInvestmentRepository.setCancelOptions.mockResolvedValue(undefined);

      mockOpen.value = true;
      // allow watchers/microtasks to flush
      await Promise.resolve();

      expect(mockInvestmentRepository.setCancelOptions).toHaveBeenCalledWith('456');
    });

    it('should not fetch cancel options when schema already exists', async () => {
      // pre-populate schema data
      mockInvestmentRepository.setCancelOptionsState.value.data = {};
      const composable = usePortfolioCancelInvestment(mockInvestment, mockOpen, mockEmit);

      mockOpen.value = true;
      await Promise.resolve();

      expect(mockInvestmentRepository.setCancelOptions).not.toHaveBeenCalled();
    });
  });
});
