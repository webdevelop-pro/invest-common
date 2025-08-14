import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref, reactive, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useFormValidation } from 'InvestCommon/composable/useFormValidation';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import { useInvestAmount } from '../useInvestAmount';

vi.mock('vue-router', () => ({
  useRouter: vi.fn(),
  useRoute: vi.fn(),
}));

vi.mock('UiKit/store/useGlobalLoader', () => ({
  useGlobalLoader: vi.fn(),
}));

vi.mock('InvestCommon/composable/useHubspotForm', () => ({
  useHubspotForm: vi.fn(),
}));

vi.mock('InvestCommon/composable/useFormValidation', () => ({
  useFormValidation: vi.fn(),
}));

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: vi.fn(),
}));

vi.mock('InvestCommon/data/investment/investment.repository', () => ({
  useRepositoryInvestment: vi.fn(),
}));

vi.mock('UiKit/helpers/validation/general', () => ({
  scrollToError: vi.fn(),
}));

const mockFormValidation = {
  model: reactive({ number_of_shares: 100 }),
  validation: ref({}),
  isValid: ref(true),
  onValidate: vi.fn(),
};

const mockInvestmentRepository = {
  setAmount: vi.fn(),
  setAmountOptionsState: ref({ data: {} }),
  setAmountState: ref({ error: null as any, data: null as any }),
  getInvestUnconfirmedOne: ref({
    offer: {
      price_per_share: 10,
      total_shares: 1000,
      subscribed_shares: 100,
      min_investment: 50,
    },
    number_of_shares: 100,
  }),
};

describe('useInvestAmount', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    
    (useRouter as any).mockReturnValue({ push: vi.fn() });
    (useRoute as any).mockReturnValue({ params: { slug: 'test', id: '123', profileId: '456' } });
    (useGlobalLoader as any).mockReturnValue({ hide: vi.fn() });
    (useHubspotForm as any).mockReturnValue({ submitFormToHubspot: vi.fn() });
    (useFormValidation as any).mockReturnValue(mockFormValidation);
    (useSessionStore as any).mockReturnValue({ userSessionTraits: ref({ email: 'test@example.com' }) });
    (useRepositoryInvestment as any).mockReturnValue(mockInvestmentRepository);
  });

  describe('computed values', () => {
    it('should calculate basic values correctly', () => {
      const composable = useInvestAmount();
      
      expect(composable.sharesAmount.value).toBe(100);
      expect(composable.investmentAmount.value).toBe(1000);
      expect(composable.investmentAmountShow.value).toBeDefined();
    });
  });

  describe('validation logic', () => {
    it('should determine if remaining shares is less than minimum', () => {
      mockFormValidation.model.number_of_shares = 850;
      const composable = useInvestAmount();
      expect(composable.isLeftLessThanMin.value).toBe(false);
      
      mockFormValidation.model.number_of_shares = 860;
      expect(composable.isLeftLessThanMin.value).toBe(true);
    });

    it('should enable button when validation passes', () => {
      mockFormValidation.isValid.value = true;
      const composable = useInvestAmount();
      expect(composable.isBtnDisabled.value).toBe(false);
    });
  });

  describe('schema generation', () => {
    it('should generate schema with correct validation rules', () => {
      const composable = useInvestAmount();
      
      expect(composable.schemaFrontend.value.definitions?.AmountStep?.properties?.number_of_shares?.minimum).toBe(50);
      expect(composable.schemaFrontend.value.definitions?.AmountStep?.properties?.number_of_shares?.maximum).toBe(900);
    });
  });

  describe('continueHandler', () => {
    it('should validate form and proceed when valid', async () => {
      mockFormValidation.isValid.value = true;
      mockInvestmentRepository.setAmount.mockResolvedValue({});
      const composable = useInvestAmount();
      
      await composable.continueHandler();
      
      expect(mockFormValidation.onValidate).toHaveBeenCalled();
      expect(mockInvestmentRepository.setAmount).toHaveBeenCalledWith('test', '123', '456', 100);
    });

    it('should handle validation failure', async () => {
      mockFormValidation.isValid.value = false;
      const composable = useInvestAmount();
      
      await composable.continueHandler();
      
      expect(mockFormValidation.onValidate).toHaveBeenCalled();
      expect(mockInvestmentRepository.setAmount).not.toHaveBeenCalled();
    });
  });

  describe('watchers', () => {
    it('should update model when numberOfShares changes', async () => {
      const composable = useInvestAmount();
      mockInvestmentRepository.getInvestUnconfirmedOne.value.number_of_shares = 150;
      
      await nextTick();
      
      expect(composable.model.number_of_shares).toBe(150);
    });
  });

  describe('error handling', () => {
    it('should expose error and schema data', () => {
      mockInvestmentRepository.setAmountState.value.error = { data: { responseJson: 'Error' } };
      mockInvestmentRepository.setAmountOptionsState.value.data = { schema: 'test' };
      
      const composable = useInvestAmount();
      
      expect(composable.errorData.value).toBe('Error');
      expect(composable.schemaBackend.value).toEqual({ schema: 'test' });
    });
  });
}); 