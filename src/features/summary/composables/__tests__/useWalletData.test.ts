import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';

// Mock wallet data
const mockEvmWalletData = {
  id: 10,
  currentBalance: 1234.56,
  balances: [
    { id: 1, name: 'USD Coin', symbol: 'USDC', amount: '100.5', address: '0x1', icon: 'usdc.svg' },
    { id: 2, name: 'Ether', symbol: 'ETH', amount: '0.25', address: '0x2', icon: 'eth.svg' },
    { id: 3, name: 'Zero', symbol: 'ZERO', amount: '0', address: '0x3' },
  ],
  transactions: [],
};

const mockWalletData = {
  id: 20,
  currentBalance: 789.12,
  isWalletStatusAnyError: false,
  isWalletStatusCreated: true,
};

// Mock repositories
vi.mock('InvestCommon/data/evm/evm.repository', () => ({
  useRepositoryEvm: () => ({
    getEvmWalletState: ref({ loading: false, error: null, data: mockEvmWalletData }),
    canLoadEvmWalletData: ref(true),
    getEvmWalletByProfile: vi.fn(),
    resetAll: vi.fn(),
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

import { useWalletData } from '../useWalletData';

describe('useWalletData', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('computes balances and tables from repository state', () => {
    const { balances, tables, walletTokensTop5, walletTokensTableRows } = useWalletData();

    expect(walletTokensTop5.value.length).toBe(2);
    expect(walletTokensTableRows.value.map((r: any) => r.symbol)).toEqual(['USDC', 'ETH']);

    // Balances formatting
    expect(balances.value[0].title).toBe('Crypto Wallet Balance:');
    expect(balances.value[1].title).toBe('Wallet Balance:');
    expect(typeof balances.value[0].balance).toBe('string');
    expect(typeof balances.value[1].balance).toBe('string');

    // Table config
    expect(tables.value[0].title).toBe('Tokens:');
    expect(tables.value[0].data.length).toBe(2);
    expect(tables.value[0].rowLength).toBe(5);
  });
});


