import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { useHubspotForm } from 'UiKit/composables/useHubspotForm';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import { useRepositoryWallet } from 'InvestCommon/data/wallet/wallet.repository';
import { useRepositoryEvm } from 'InvestCommon/data/evm/evm.repository';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { FundingTypes } from 'InvestCommon/helpers/enums/general';
import { ROUTE_INVEST_SIGNATURE } from 'InvestCommon/domain/config/enums/routes';
import { useInvestAmount } from '../useInvestAmount';

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>();
  return {
    ...actual,
    useRouter: vi.fn(),
    useRoute: vi.fn(),
    onBeforeRouteLeave: vi.fn(),
  };
});

vi.mock('UiKit/store/useGlobalLoader', () => ({
  useGlobalLoader: vi.fn(),
}));

vi.mock('UiKit/composables/useHubspotForm', () => ({
  useHubspotForm: vi.fn(),
}));

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: vi.fn(),
}));

vi.mock('InvestCommon/data/investment/investment.repository', () => ({
  useRepositoryInvestment: vi.fn(),
}));

vi.mock('InvestCommon/data/wallet/wallet.repository', () => ({
  useRepositoryWallet: vi.fn(),
}));

vi.mock('InvestCommon/data/evm/evm.repository', () => ({
  useRepositoryEvm: vi.fn(),
}));

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: vi.fn(),
}));

describe('useInvestAmount (logic)', () => {
  const mockRouter = { push: vi.fn() };
  const mockRoute = {
    params: { slug: 'test-slug', id: '123', profileId: '456' },
  };
  const mockGlobalLoader = { hide: vi.fn() };
  const mockHubspotForm = { submitFormToHubspot: vi.fn() };
  const mockSessionStore = {
    userLoggedIn: ref(true),
    userSessionTraits: ref({ email: 'test@example.com' }),
  };

  const mockInvestmentRepository = {
    setAmount: vi.fn().mockResolvedValue(undefined),
    setAmountState: ref({ loading: false, error: null as any }),
    setAmountOptionsState: ref({ data: {} }),
    getInvestUnconfirmedOne: ref({}),
  };

  const mockWalletRepository = {
    getWalletByProfile: vi.fn(),
    getWalletState: ref({ data: { totalBalance: 1000 } }),
    walletId: ref(1),
    canLoadWalletData: ref(true),
  };

  const mockEvmRepository = {
    getEvmWalletByProfile: vi.fn(),
    getEvmWalletState: ref({ data: { fundingBalance: 500 } }),
    evmWalletId: ref(2),
    canLoadEvmWalletData: ref(true),
  };

  const mockProfilesStore = {
    selectedUserProfileData: ref({ data: { id: 10 } }),
    selectedUserProfileId: ref(10),
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    (useRouter as any).mockReturnValue(mockRouter);
    (useRoute as any).mockReturnValue(mockRoute);
    (useGlobalLoader as any).mockReturnValue(mockGlobalLoader);
    (useHubspotForm as any).mockReturnValue(mockHubspotForm);
    (useSessionStore as any).mockReturnValue(mockSessionStore);
    (useRepositoryInvestment as any).mockReturnValue(mockInvestmentRepository);
    (useRepositoryWallet as any).mockReturnValue(mockWalletRepository);
    (useRepositoryEvm as any).mockReturnValue(mockEvmRepository);
    (useProfilesStore as any).mockReturnValue(mockProfilesStore);
  });

  it('initializes with loader hidden and exposes repository state', () => {
    const composable = useInvestAmount();

    expect(mockGlobalLoader.hide).toHaveBeenCalled();
    expect(composable.setAmountState).toBeDefined();
    expect(composable.setAmountOptionsState).toBeDefined();
    expect(composable.getInvestUnconfirmedOne).toBeDefined();
  });

  it('computes isBtnDisabled based on child form refs', () => {
    const composable = useInvestAmount();

    // Initially no refs set -> disabled
    expect(composable.isBtnDisabled.value).toBe(true);

    composable.amountFormRef.value = {
      isValid: true,
      isBtnDisabled: false,
      onValidate: vi.fn(),
      scrollToError: vi.fn(),
      model: { number_of_shares: 10 },
    } as any;

    composable.ownershipFormRef.value = {
      isValid: true,
      isBtnDisabled: false,
      onValidate: vi.fn(),
      scrollToError: vi.fn(),
      model: { profile_id: 5 },
    } as any;

    composable.fundingFormRef.value = {
      isValid: true,
      isBtnDisabled: false,
      onValidate: vi.fn(),
      scrollToError: vi.fn(),
      model: { funding_type: FundingTypes.wallet },
      componentData: {
        isInvalid: false,
        accountHolderName: '',
        accountType: '',
        accountNumber: '',
        routingNumber: '',
      },
    } as any;

    expect(composable.isBtnDisabled.value).toBe(false);
  });

  it('handles validation failures in handleContinue', async () => {
    const composable = useInvestAmount();

    const amountRef = {
      isValid: false,
      isBtnDisabled: false,
      onValidate: vi.fn(),
      scrollToError: vi.fn(),
      model: { number_of_shares: 10 },
    } as any;

    composable.amountFormRef.value = amountRef;
    composable.ownershipFormRef.value = {
      isValid: true,
      isBtnDisabled: false,
      onValidate: vi.fn(),
      scrollToError: vi.fn(),
      model: { profile_id: 5 },
    } as any;
    composable.fundingFormRef.value = {
      isValid: true,
      isBtnDisabled: false,
      onValidate: vi.fn(),
      scrollToError: vi.fn(),
      model: { funding_type: FundingTypes.wallet },
      componentData: {
        isInvalid: false,
        accountHolderName: '',
        accountType: '',
        accountNumber: '',
        routingNumber: '',
      },
    } as any;

    await composable.handleContinue();

    expect(amountRef.onValidate).toHaveBeenCalled();
    expect(mockInvestmentRepository.setAmount).not.toHaveBeenCalled();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('submits combined payload and navigates on successful handleContinue', async () => {
    const composable = useInvestAmount();

    composable.amountFormRef.value = {
      isValid: true,
      isBtnDisabled: false,
      onValidate: vi.fn(),
      scrollToError: vi.fn(),
      model: { number_of_shares: 20 },
      investmentAmount: 2000,
    } as any;

    composable.ownershipFormRef.value = {
      isValid: true,
      isBtnDisabled: false,
      onValidate: vi.fn(),
      scrollToError: vi.fn(),
      model: { profile_id: 7 },
    } as any;

    composable.fundingFormRef.value = {
      isValid: true,
      isBtnDisabled: false,
      onValidate: vi.fn(),
      scrollToError: vi.fn(),
      model: { funding_type: FundingTypes.wallet },
      componentData: {
        isInvalid: false,
        accountHolderName: 'John Doe',
        accountType: 'checking',
        accountNumber: '1234',
        routingNumber: '5678',
      },
    } as any;

    await composable.handleContinue();

    expect(mockInvestmentRepository.setAmount).toHaveBeenCalledWith(
      'test-slug',
      '123',
      '456',
      expect.objectContaining({
        number_of_shares: 20,
        profile_id: 7,
      }),
    );

    expect(mockHubspotForm.submitFormToHubspot).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@example.com',
        shares_amount: 20,
        investment_amount: 2000,
      }),
    );

    expect(mockRouter.push).toHaveBeenCalledWith({
      name: ROUTE_INVEST_SIGNATURE,
      params: expect.objectContaining({ profileId: '7' }),
    });
  });

  it('builds ACH funding payload with payment data', async () => {
    const composable = useInvestAmount();

    composable.amountFormRef.value = {
      isValid: true,
      isBtnDisabled: false,
      onValidate: vi.fn(),
      scrollToError: vi.fn(),
      model: { number_of_shares: 5 },
      investmentAmount: 500,
    } as any;

    composable.ownershipFormRef.value = {
      isValid: true,
      isBtnDisabled: false,
      onValidate: vi.fn(),
      scrollToError: vi.fn(),
      model: { profile_id: 3 },
    } as any;

    composable.fundingFormRef.value = {
      isValid: true,
      isBtnDisabled: false,
      onValidate: vi.fn(),
      scrollToError: vi.fn(),
      model: { funding_type: FundingTypes.ach },
      componentData: {
        isInvalid: false,
        accountHolderName: 'John Doe',
        accountType: 'checking',
        accountNumber: '1234',
        routingNumber: '5678',
      },
    } as any;

    await composable.handleContinue();

    expect(mockInvestmentRepository.setAmount).toHaveBeenCalledWith(
      'test-slug',
      '123',
      '456',
      expect.objectContaining({
        funding_type: FundingTypes.ach,
        payment_data: {
          account_number: '1234',
          routing_number: '5678',
          account_holder_name: 'John Doe',
          account_type: 'checking',
        },
      }),
    );
  });

  it('resets funding method and reloads wallets when profile_id changes', async () => {
    const composable = useInvestAmount();

    // Set initial funding form state
    const fundingRef = {
      isValid: true,
      isBtnDisabled: false,
      onValidate: vi.fn(),
      scrollToError: vi.fn(),
      model: { funding_type: FundingTypes.wallet },
      componentData: {
        isInvalid: false,
        accountHolderName: '',
        accountType: '',
        accountNumber: '',
        routingNumber: '',
      },
    } as any;

    composable.fundingFormRef.value = fundingRef;

    // Change profile_id in shared formModel
    composable.formModel.value.profile_id = 42;
    await nextTick();

    // funding_type should be reset
    expect(fundingRef.model.funding_type).toBeUndefined();

    // Wallet repositories should be called with new profile id
    expect(mockWalletRepository.getWalletByProfile).toHaveBeenCalledWith(42);
    expect(mockEvmRepository.getEvmWalletByProfile).toHaveBeenCalledWith(42);
  });
});

