import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import { ROUTE_INVEST_THANK } from 'InvestCommon/helpers/enums/routes';
import { useInvestReview } from '../useInvestReview';

vi.mock('vue-router', () => ({
  useRouter: vi.fn(),
  useRoute: vi.fn(),
}));

vi.mock('UiKit/store/useGlobalLoader', () => ({
  useGlobalLoader: vi.fn(),
}));

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: vi.fn(),
}));

vi.mock('InvestCommon/composable/useHubspotForm', () => ({
  useHubspotForm: vi.fn(),
}));

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: vi.fn(),
}));

vi.mock('InvestCommon/data/investment/investment.repository', () => ({
  useRepositoryInvestment: vi.fn(),
}));

describe('useInvestReview', () => {
  const mockRouter = { push: vi.fn() };
  const mockRoute = {
    params: { slug: 'test-slug', id: 'test-id', profileId: 'test-profile-id' },
  };
  const mockGlobalLoader = { hide: vi.fn() };
  const mockHubspotForm = { submitFormToHubspot: vi.fn() };
  const mockProfilesStore = {
    selectedUserProfileData: ref({
      data: {
        first_name: 'John',
        middle_name: 'Michael',
        last_name: 'Doe',
      },
    }),
  };
  const mockSessionStore = {
    userSessionTraits: ref({ email: 'test@example.com' }),
  };
  const mockInvestmentRepository = {
    setReview: vi.fn(),
    getInvestUnconfirmedOne: ref({
      funding_type: 'wallet',
      offer: {
        name: 'Test Offer',
        slug: 'test-offer',
      },
    }),
    setReviewState: ref({ loading: false, data: null }),
    $onAction: vi.fn(),
  };

  let actionCallback: any;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    (useRouter as any).mockReturnValue(mockRouter);
    (useRoute as any).mockReturnValue(mockRoute);
    (useGlobalLoader as any).mockReturnValue(mockGlobalLoader);
    (useHubspotForm as any).mockReturnValue(mockHubspotForm);
    (useProfilesStore as any).mockReturnValue(mockProfilesStore);
    (useSessionStore as any).mockReturnValue(mockSessionStore);
    (useRepositoryInvestment as any).mockReturnValue(mockInvestmentRepository);

    mockInvestmentRepository.$onAction.mockImplementation((callback) => {
      actionCallback = callback;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('computed properties', () => {
    describe('investorName', () => {
      it('should combine name parts correctly', () => {
        const composable = useInvestReview();
        expect(composable.investorName.value).toBe('John Michael Doe');
      });

      it('should handle missing name parts', () => {
        (mockProfilesStore.selectedUserProfileData as any).value = {
          data: {
            first_name: 'John',
            middle_name: undefined,
            last_name: 'Doe',
          },
        };
        
        const composable = useInvestReview();
        expect(composable.investorName.value).toBe('John Doe');
      });
    });

    describe('fundingSourceDataToShow', () => {
      it('should format wallet funding type correctly', () => {
        (mockInvestmentRepository.getInvestUnconfirmedOne as any).value.funding_type = 'wallet';
        
        const composable = useInvestReview();
        expect(composable.fundingSourceDataToShow.value).toBe('Wallet');
      });

      it('should format non-wallet funding type correctly', () => {
        (mockInvestmentRepository.getInvestUnconfirmedOne as any).value.funding_type = 'bank transfer';
        
        const composable = useInvestReview();
        expect(composable.fundingSourceDataToShow.value).toBe('BANK TRANSFER');
      });

      it('should handle missing funding type', () => {
        (mockInvestmentRepository.getInvestUnconfirmedOne as any).value.funding_type = null;
        
        const composable = useInvestReview();
        expect(composable.fundingSourceDataToShow.value).toBe('');
      });
    });
  });

  describe('confirmInvest method', () => {
    it('should call setReview with correct parameters', async () => {
      const composable = useInvestReview();
      
      await composable.confirmInvest();
      
      expect(mockInvestmentRepository.setReview).toHaveBeenCalledWith(
        'test-slug',
        'test-id',
        'test-profile-id'
      );
    });
  });

  describe('action listener behavior', () => {
    it('should handle successful setReview action', async () => {

      (mockInvestmentRepository.setReviewState as any).value = { 
        loading: false, 
        data: {
          investment: {
            id: 'investment-123',
            status: 'confirmed',
          },
        }
      };

      if (actionCallback) {
        actionCallback({
          name: 'setReview',
          after: (callback: any) => {
            if (callback && typeof callback === 'function') {
              callback();
            }
          },
        });
      }

      await nextTick();

      expect(mockRouter.push).toHaveBeenCalledWith({
        name: ROUTE_INVEST_THANK,
        params: { id: 'investment-123' },
      });

      expect(mockHubspotForm.submitFormToHubspot).toHaveBeenCalledWith({
        email: 'test@example.com',
        investment_id: 'investment-123',
        offer_name: 'Test Offer',
        offer_slug: 'test-offer',
        investment_status: 'confirmed',
      });
    });

    it('should not handle non-setReview actions', () => {

      if (actionCallback) {
        actionCallback({
          name: 'otherAction',
          after: (callback: any) => {
            if (callback && typeof callback === 'function') {
              callback();
            }
          },
        });
      }

      expect(mockRouter.push).not.toHaveBeenCalled();
      expect(mockHubspotForm.submitFormToHubspot).not.toHaveBeenCalled();
    });

    it('should not handle setReview action without investment data', () => {

      (mockInvestmentRepository.setReviewState as any).value = { loading: false, data: null };

      if (actionCallback) {
        actionCallback({
          name: 'setReview',
          after: (callback: any) => {
            if (callback && typeof callback === 'function') {
              callback();
            }
          },
        });
      }

      expect(mockRouter.push).not.toHaveBeenCalled();
      expect(mockHubspotForm.submitFormToHubspot).not.toHaveBeenCalled();
    });
  });
});
