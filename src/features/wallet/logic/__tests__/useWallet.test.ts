import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';

const mockFiatWallet = {
  id: 1,
  status: 'verified',
  balance: 5000,
  currentBalance: 5000,
  pending_incoming_balance: 100,
  pending_outcoming_balance: 0,
  pendingIncomingBalanceFormatted: '+$100.00',
  funding_source: [
    { id: 1, bank_name: 'Chase', name: 'Checking ****1234', type: 'ach', status: 'verified' },
  ],
  isWalletStatusAnyError: false,
  isWalletStatusCreated: false,
  isWalletStatusVerified: true,
};

const mockEvmWallet = {
  id: 1,
  address: '0xCABBAc435948510D24820746Ee29706a05A54369',
  status: 'verified',
  fundingBalance: 2500.75,
  rwaBalance: 500.25,
  currentBalance: 3001,
  totalBalance: 3001,
  balances: [],
  isStatusCreated: false,
  isStatusVerified: true,
  isStatusAnyError: false,
};

const getWalletStateRef = ref({
  data: mockFiatWallet,
  loading: false,
  error: null as Error | null,
});
const getEvmWalletStateRef = ref({
  data: mockEvmWallet,
  loading: false,
  error: null as Error | null,
});

vi.mock('InvestCommon/data/wallet/wallet.repository', () => ({
  useRepositoryWallet: () => ({
    getWalletState: getWalletStateRef,
    canLoadWalletData: ref(true),
    getWalletByProfile: vi.fn().mockResolvedValue(undefined),
    resetAll: vi.fn(),
  }),
}));

vi.mock('InvestCommon/data/evm/evm.repository', () => ({
  useRepositoryEvm: () => ({
    getEvmWalletState: getEvmWalletStateRef,
    canLoadEvmWalletData: ref(true),
    getEvmWalletByProfile: vi.fn().mockResolvedValue(undefined),
    resetAll: vi.fn(),
  }),
}));

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: () => ({
    selectedUserProfileData: ref({ id: 1, kyc_status: 'approved' }),
    selectedUserProfileId: ref(1),
  }),
}));

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: () => ({ userLoggedIn: ref(true) }),
}));

vi.mock('InvestCommon/data/profiles/profiles.repository', () => ({
  useRepositoryProfiles: () => ({ getProfileByIdState: ref({ loading: false }) }),
}));

import { useWallet } from '../useWallet';

describe('useWallet', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    getWalletStateRef.value = { data: { ...mockFiatWallet }, loading: false, error: null };
    getEvmWalletStateRef.value = { data: { ...mockEvmWallet }, loading: false, error: null };
  });

  it('computes fiat balance from wallet state', () => {
    const api = useWallet();
    expect(api.fiatBalance.value).toBe(5000);
    expect(api.fiatBalanceMainFormatted.value).toBeDefined();
    expect(api.fiatBalanceCoins.value).toBeDefined();
    expect(api.fiatPendingDeposit.value).toBe('+$100.00');
  });

  it('computes crypto balance from evm state', () => {
    const api = useWallet();
    expect(api.cryptoBalance.value).toBe(2500.75);
    expect(api.cryptoBalanceMainFormatted.value).toBeDefined();
  });

  it('computes rwa balance from evm state', () => {
    const api = useWallet();
    expect(api.rwaBalance.value).toBe(500.25);
  });

  it('computes total balance as sum of fiat, crypto, rwa', () => {
    const api = useWallet();
    expect(api.totalBalance.value).toBe(5000 + 2500.75 + 500.25);
    expect(api.totalBalanceMainFormatted.value).toBeDefined();
  });

  it('exposes updateData', () => {
    const api = useWallet();
    expect(typeof api.updateData).toBe('function');
  });
});
