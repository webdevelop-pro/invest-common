import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';
import { EvmTransactionTypes } from 'InvestCommon/data/evm/evm.types';

const mockEvmWalletData = {
  id: 1,
  address: '0xCABBAc435948510D24820746Ee29706a05A54369',
  status: 'verified',
  balance: '1500',
  inc_balance: 0,
  out_balance: 0,
  fundingBalance: 1500,
  rwaBalance: 0,
  pendingIncomingBalance: 0,
  pendingOutcomingBalance: 0,
  isStatusCreated: false,
  isStatusVerified: true,
  isStatusAnyError: false,
  balances: [
    { id: 1, address: '0xusdc', symbol: 'USDC', amount: 1000, name: 'USD Coin' },
    { id: 2, address: '0xeth', symbol: 'ETH', amount: 0.5, name: 'Ether' },
  ],
};

const getEvmWalletStateRef = ref({
  data: mockEvmWalletData,
  loading: false,
  error: null as Error | null,
});

vi.mock('InvestCommon/data/evm/evm.repository', () => ({
  useRepositoryEvm: () => ({
    getEvmWalletState: getEvmWalletStateRef,
  }),
}));

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: () => ({
    selectedUserProfileData: ref({
      id: 1,
      isKycApproved: true,
      isKycNone: false,
      isKycNew: false,
      isKycPending: false,
      isKycInProgress: false,
      isKycDeclined: false,
      isTypeSdira: false,
    }),
    selectedUserProfileId: ref(1),
  }),
}));

const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useRoute: () => ({ name: 'dashboard', path: '/dashboard', query: {} }),
}));

import { useWalletActions } from '../useWalletActions';

describe('useWalletActions', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    getEvmWalletStateRef.value = {
      data: { ...mockEvmWalletData },
      loading: false,
      error: null,
    };
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  it('returns balances, buttonConfigs, and handleButtonClick', () => {
    const api = useWalletActions();
    expect(api.balances).toBeDefined();
    expect(api.buttonConfigs).toBeDefined();
    expect(api.handleButtonClick).toBeDefined();
  });

  it('builds balances with wallet balance and optional incoming/outgoing', () => {
    const api = useWalletActions();
    expect(api.balances.value.length).toBeGreaterThanOrEqual(1);
    expect(api.balances.value[0]).toMatchObject({
      title: 'Wallet Balance:',
      href: expect.any(String),
    });
  });

  it('includes incoming/outgoing when pending balances are positive', () => {
    getEvmWalletStateRef.value.data!.pendingIncomingBalance = 100;
    getEvmWalletStateRef.value.data!.pendingOutcomingBalance = 50;
    const api = useWalletActions();
    const titles = api.balances.value.map((b: { title: string }) => b.title);
    expect(titles).toContain('Incoming:');
    expect(titles).toContain('Outgoing:');
  });

  it('builds buttonConfigs with add-funds, withdraw, exchange, buy, earn', () => {
    const api = useWalletActions();
    const ids = api.buttonConfigs.value.map((b: { id: string }) => b.id);
    expect(ids).toEqual(['add-funds', 'withdraw', 'exchange', 'buy', 'earn']);
    expect(api.buttonConfigs.value[0].label).toBe('Add Funds');
    expect(api.buttonConfigs.value[0].transactionType).toBe(EvmTransactionTypes.deposit);
  });

  it('disables add-funds when wallet not ready', () => {
    getEvmWalletStateRef.value.data!.isStatusVerified = false;
    getEvmWalletStateRef.value.data!.isStatusCreated = false;
    const api = useWalletActions();
    const addFunds = api.buttonConfigs.value.find((b: { id: string }) => b.id === 'add-funds');
    expect(addFunds?.disabled).toBe(true);
  });

  it('calls emit when handleButtonClick is called with transaction type', () => {
    const emit = vi.fn();
    const api = useWalletActions({}, emit);
    api.handleButtonClick({
      id: 'add-funds',
      transactionType: EvmTransactionTypes.deposit,
    });
    expect(emit).toHaveBeenCalledWith('click', EvmTransactionTypes.deposit);
  });

  it('navigates to earn when handleButtonClick is called with earn id', () => {
    const api = useWalletActions();
    api.handleButtonClick({ id: 'earn' });
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'ROUTE_DASHBOARD_EARN' }),
    );
  });
});
