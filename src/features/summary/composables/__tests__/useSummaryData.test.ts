import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';

// Mock crypto data
const mockCryptoData = {
  bitcoin: { usd: 100, usd_24h_change: 1 },
};

// Mock portfolio data
const mockPortfolioData = [
  { amount: 1000, offer: { id: 1, name: 'Test Offer', security_type: 'Equity' } },
];

// Mock wallet data
const mockEvmWalletData = {
  id: 1,
  currentBalance: 500,
  balances: [],
  transactions: [],
};

const mockWalletData = {
  id: 2,
  currentBalance: 1000,
  isWalletStatusAnyError: false,
  isWalletStatusCreated: true,
};

// Mock repositories
vi.mock('InvestCommon/data/3dParty/crypto.repository', () => ({
  useRepositoryCryptoo: () => ({
    getPricesState: ref({ loading: false, error: null, data: mockCryptoData }),
    getSimplePrices: vi.fn(),
  }),
}));

vi.mock('InvestCommon/features/investment/store/useDashboardPortfolio', () => ({
  useDashboardPortfolioStore: () => ({
    portfolioData: ref(mockPortfolioData),
    getInvestmentsState: ref({ loading: false, error: null, data: { data: mockPortfolioData } }),
  }),
}));

vi.mock('InvestCommon/data/wallet/wallet.repository', () => ({
  useRepositoryWallet: () => ({
    getWalletState: ref({ loading: false, error: null, data: mockWalletData }),
    canLoadWalletData: ref(true),
    getWalletByProfile: vi.fn(),
    resetAll: vi.fn(),
  }),
}));

vi.mock('InvestCommon/data/evm/evm.repository', () => ({
  useRepositoryEvm: () => ({
    getEvmWalletState: ref({ loading: false, error: null, data: mockEvmWalletData }),
    canLoadEvmWalletData: ref(true),
    getEvmWalletByProfile: vi.fn(),
    resetAll: vi.fn(),
  }),
}));

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: () => ({
    selectedUserProfileId: ref(1),
    selectedUserProfileData: ref({
      id: 1,
      isKycApproved: true,
      isTypeSdira: false,
      isTypeSolo401k: false,
      kyc_status: 'approved',
    }),
  }),
}));

vi.mock('InvestCommon/data/offer/offer.repository', () => ({
  useRepositoryOffer: () => ({
    getOffersState: ref({ loading: false, error: null, data: [] }),
    getOffers: vi.fn(),
    getTopOpenOffer: vi.fn().mockReturnValue({ id: 1, name: 'Test Offer' }),
  }),
}));

import { useSummaryData } from '../useSummaryData';

describe('useSummaryData', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('exposes combined data and formatters', () => {
    const api = useSummaryData();

    // Formatters
    expect(api.defaultAmountFormatter(1000)).toMatch('$');
    expect(api.defaultPercentFormatter(12.3)).toBe('12%');
    expect(api.percentValueFormatter(15)).toBe('15%');

    // Combined loading state
    expect(api.isLoading.value).toBe(false);

    // Data from child composables
    expect(api.cryptoItems.value).toBeDefined();
    expect(api.totalAmount.value).toBe(1000);
    expect(api.balances.value).toHaveLength(2);
  });
});


