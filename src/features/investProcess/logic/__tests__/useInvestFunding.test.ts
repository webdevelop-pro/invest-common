import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref, reactive, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import { useFormValidation } from 'InvestCommon/composable/useFormValidation';
import { useRepositoryEvm } from 'InvestCommon/data/evm/evm.repository';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryWallet } from 'InvestCommon/data/wallet/wallet.repository';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import { FundingTypes } from 'InvestCommon/helpers/enums/general';
import { ROUTE_INVEST_REVIEW } from 'InvestCommon/helpers/enums/routes';
import { useInvestFunding } from '../useInvestFunding';


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

vi.mock('InvestCommon/data/evm/evm.repository', () => ({
  useRepositoryEvm: vi.fn(),
}));

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: vi.fn(),
}));

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: vi.fn(),
}));

vi.mock('InvestCommon/data/wallet/wallet.repository', () => ({
  useRepositoryWallet: vi.fn(),
}));

vi.mock('InvestCommon/data/investment/investment.repository', () => ({
  useRepositoryInvestment: vi.fn(),
}));

vi.mock('UiKit/helpers/validation/general', () => ({
  scrollToError: vi.fn(),
}));

const mockData = {
  formValidation: {
    model: reactive({ funding_type: FundingTypes.ach }),
    validation: ref({}),
    isValid: ref(true),
    onValidate: vi.fn(),
  },
  evmWallet: {
    getEvmWalletState: ref({
      data: { totalBalance: 5000, isStatusAnyError: false },
      error: null,
    }),
    evmWalletId: ref(1),
    canLoadEvmWalletData: ref(true),
    getEvmWalletByProfile: vi.fn(),
  },
  profiles: {
    selectedUserProfileData: ref({
      data: { first_name: 'John', last_name: 'Doe' },
    }),
    selectedUserProfileId: ref('profile123'),
  },
  session: {
    userSessionTraits: ref({ email: 'john.doe@example.com' }),
    userLoggedIn: ref(true),
  },
  wallet: {
    getWalletState: ref({
      data: {
        funding_source: [
          { id: 1, bank_name: 'Chase Bank', name: 'Checking Account' },
          { id: 2, bank_name: 'Wells Fargo', name: 'Savings Account' },
        ],
        totalBalance: 10000,
        isWalletStatusAnyError: false,
      },
    }),
    walletId: ref(1),
    canLoadWalletData: ref(true),
    getWalletByProfile: vi.fn(),
  },
  investment: {
    getInvestUnconfirmedOne: ref({
      amount: 5000,
      offer: { id: 'offer123', name: 'Test Offer' },
      payment_data: {},
      funding_type: 'none',
    }),
    setFundingOptionsState: ref({ data: {} }),
    setFundingState: ref({ error: null, data: null }),
    setFunding: vi.fn(),
  },
  router: { push: vi.fn() },
  route: {
    params: { id: '123', slug: 'test-offer', profileId: 'profile123' },
  },
};

describe('useInvestFunding', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    (useRouter as any).mockReturnValue(mockData.router);
    (useRoute as any).mockReturnValue(mockData.route);
    (useGlobalLoader as any).mockReturnValue({ hide: vi.fn() });
    (useHubspotForm as any).mockReturnValue({ submitFormToHubspot: vi.fn() });
    
    const formValidationMock = {
      model: mockData.formValidation.model,
      validation: mockData.formValidation.validation,
      isValid: mockData.formValidation.isValid,
      onValidate: vi.fn(() => {
        // This will be called by continueHandler, but we'll control isValid directly
      }),
    };
    (useFormValidation as any).mockReturnValue(formValidationMock);
    
    (useRepositoryEvm as any).mockReturnValue(mockData.evmWallet);
    (useProfilesStore as any).mockReturnValue(mockData.profiles);
    (useSessionStore as any).mockReturnValue(mockData.session);
    (useRepositoryWallet as any).mockReturnValue(mockData.wallet);
    (useRepositoryInvestment as any).mockReturnValue(mockData.investment);
    
    // Reset mock data to initial state
    mockData.investment.getInvestUnconfirmedOne.value.amount = 5000;
    mockData.wallet.getWalletState.value.data.totalBalance = 10000;
    mockData.evmWallet.getEvmWalletState.value.data.totalBalance = 5000;
  });

  describe('computed properties', () => {
    it('should calculate all computed values correctly', () => {
      const composable = useInvestFunding();
      
      expect(composable.fundingSourceFormatted.value).toHaveLength(2);
      expect(composable.userName.value).toBe('John Doe');
      expect(composable.hasWallet.value).toBe(true);
      expect(composable.hasEvmWallet.value).toBe(true);
      
      const options = composable.selectOptions.value;
      expect(options).toHaveLength(6);
      expect(options[0].value).toBe(FundingTypes.ach);
      expect(options[2].text).toContain('$10,000.00');
      expect(options[3].text).toContain('$5,000.00');
    });

    it('should handle button disabled states', () => {
      const composable = useInvestFunding();
      
      const testCases = [
        { type: FundingTypes.ach, invalid: true, expected: true },
        { type: FundingTypes.wallet, amount: 15000, expected: true },
        { type: FundingTypes.cryptoWallet, amount: 6000, expected: true },
        { type: FundingTypes.ach, invalid: false, expected: false },
      ];
      
      testCases.forEach(({ type, invalid, amount, expected }) => {
        mockData.formValidation.model.funding_type = type;
        if (invalid !== undefined) composable.componentData.value.isInvalid = invalid;
        if (amount !== undefined) mockData.investment.getInvestUnconfirmedOne.value.amount = amount;
        
        expect(composable.isBtnDisabled.value).toBe(expected);
      });
      
      // Reset the amount back to the original value to avoid affecting other tests
      mockData.investment.getInvestUnconfirmedOne.value.amount = 5000;
    });

    it('should determine current component and props', () => {
      const composable = useInvestFunding();
      
      // Test component selection
      const componentTests = [
        { type: FundingTypes.wire, hasComponent: true },
        { type: FundingTypes.ach, hasComponent: true },
        { type: FundingTypes.wallet, hasComponent: false },
      ];
      
      componentTests.forEach(({ type, hasComponent }) => {
        mockData.formValidation.model.funding_type = type;
        if (hasComponent) {
          expect(composable.currentComponent.value).toBeDefined();
          expect(composable.currentProps.value).toBeDefined();
        } else {
          expect(composable.currentComponent.value).toBeNull();
        }
      });
    });
  });

  describe('validation and errors', () => {
    it('should return appropriate errors for different scenarios', () => {
      const composable = useInvestFunding();
      
      const errorTests = [
        {
          type: FundingTypes.cryptoWallet,
          amount: 6000,
          expected: ['Crypto wallet does not have enough funds'],
        },
        {
          type: FundingTypes.wallet,
          amount: 15000,
          expected: ['Wallet does not have enough funds'],
        },
        {
          type: FundingTypes.wallet,
          amount: 5000,
          backendError: { wallet: ['Backend error'] },
          expected: ['Backend error'],
        },
      ];
      
      errorTests.forEach(({ type, amount, backendError, expected }) => {
        mockData.formValidation.model.funding_type = type;
        if (amount !== undefined) mockData.investment.getInvestUnconfirmedOne.value.amount = amount;
        if (backendError !== undefined) {
          (mockData.investment.setFundingState.value as any).error = { data: { responseJson: backendError } };
        }
        
        expect(composable.selectErrors.value).toEqual(expected);
      });
    });
  });

  describe('continueHandler', () => {
    it('should handle different funding types correctly', async () => {
      const composable = useInvestFunding();
      mockData.formValidation.isValid.value = true;
      mockData.investment.setFunding.mockResolvedValue({});
      
      const fundingTests = [
        {
          type: FundingTypes.ach,
          componentData: {
            isInvalid: false,
            accountHolderName: 'John Doe',
            accountType: 'checking',
            accountNumber: '123456789',
            routingNumber: '987654321',
          },
          expectedData: {
            funding_type: FundingTypes.ach,
            payment_data: {
              account_number: '123456789',
              routing_number: '987654321',
              account_holder_name: 'John Doe',
              account_type: 'checking',
            },
          },
        },
        {
          type: FundingTypes.wallet,
          expectedData: { 
            funding_type: FundingTypes.wallet 
          },
        },
        {
          type: FundingTypes.cryptoWallet,
          expectedData: {
            funding_source_id: NaN,
            funding_type: FundingTypes.cryptoWallet,
          },
        },
        {
          type: '1' as any, // External funding source
          expectedData: { funding_source_id: 1, funding_type: FundingTypes.wallet },
        },
      ];
      
      for (const test of fundingTests) {
        mockData.investment.setFunding.mockClear();
        
        mockData.formValidation.model.funding_type = test.type;
        if (test.componentData) {
          composable.componentData.value = test.componentData;
        }
        
        await composable.continueHandler();
        
        expect(mockData.investment.setFunding).toHaveBeenCalledWith(
          'test-offer',
          '123',
          'profile123',
          test.expectedData
        );
      }
    });

    it('should handle validation and navigation', async () => {
      const composable = useInvestFunding();
      
      mockData.formValidation.isValid.value = false;
      await composable.continueHandler();
      expect(mockData.investment.setFunding).not.toHaveBeenCalled();
      
      mockData.formValidation.isValid.value = true;
      mockData.investment.setFunding.mockResolvedValue({});
      
      (mockData.investment.setFundingState.value as any).error = null;
      
      mockData.formValidation.model.funding_type = FundingTypes.ach;
      composable.componentData.value = {
        isInvalid: false,
        accountHolderName: 'John Doe',
        accountType: 'checking',
        accountNumber: '1234567890',
        routingNumber: '021000021',
      };
      await composable.continueHandler();
      
      expect(mockData.router.push).toHaveBeenCalledWith({ name: ROUTE_INVEST_REVIEW });
      
      (mockData.investment.setFundingState.value as any).error = { message: 'Error' };
      await composable.continueHandler();
      expect(mockData.router.push).toHaveBeenCalledTimes(1); // Should not call again
    });
  });

  describe('watchers and lifecycle', () => {
    it('should watch for funding type changes', async () => {
      const composable = useInvestFunding();
      
      mockData.investment.getInvestUnconfirmedOne.value.funding_type = FundingTypes.wire;
      await nextTick();
      expect(composable.model.funding_type).toBe(FundingTypes.wire);
      
      mockData.investment.getInvestUnconfirmedOne.value.funding_type = 'none';
      await nextTick();
      expect(composable.model.funding_type).toBe(FundingTypes.wire); // Should remain unchanged
    });
  });

  describe('edge cases', () => {
    it('should handle edge cases gracefully', () => {
      const composable = useInvestFunding();
      
      mockData.wallet.getWalletState.value.data.totalBalance = 0;
      mockData.evmWallet.getEvmWalletState.value.data.totalBalance = 0;
      
      const options = composable.selectOptions.value;
      expect(options[2].disabled).toBe(true); // Wallet
      expect(options[3].disabled).toBe(true); // Crypto Wallet
      
      mockData.wallet.getWalletState.value.data.isWalletStatusAnyError = true;
      expect(composable.hasWallet.value).toBe(false);
      
      mockData.evmWallet.getEvmWalletState.value.data.isStatusAnyError = true;
      expect(composable.hasEvmWallet.value).toBe(false);
      
      (mockData.investment.setFundingState.value as any).error = { data: { responseJson: { field: 'Error' } } };
      expect(composable.errorData.value).toEqual({ field: 'Error' });
    });
  });
});
