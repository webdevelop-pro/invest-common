import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';

const mockEvmData = {
  id: 1,
  address: '0xCABBAc435948510D24820746Ee29706a05A54369',
  balances: [
    { id: 1, symbol: 'USDC', name: 'USD Coin', amount: 1000 },
    { id: 2, symbol: 'ETH', name: 'Ether', amount: 0.5 },
  ],
  fundingBalance: 2500,
  rwaBalance: 500,
  isStatusCreated: false,
  isStatusVerified: true,
  isStatusAnyError: false,
};
const mockWalletData = {
  id: 1,
  currentBalance: 5000,
  pendingIncomingBalanceFormatted: '+$100.00',
  funding_source: [],
  isWalletStatusAnyError: false,
  isWalletStatusCreated: false,
  isWalletStatusVerified: true,
};

const getEvmWalletStateRef = ref({
  data: mockEvmData,
  loading: false,
  error: null as Error | null,
});
const getWalletStateRef = ref({
  data: mockWalletData,
  loading: false,
  error: null as Error | null,
});
const getTransactionsStateRef = ref({ data: [], loading: false, error: null as Error | null });
const walletIdRef = ref(1);

vi.mock('InvestCommon/data/evm/evm.repository', () => ({
  useRepositoryEvm: () => ({
    getEvmWalletState: getEvmWalletStateRef,
    canLoadEvmWalletData: ref(true),
    getEvmWalletByProfile: vi.fn(),
    resetAll: vi.fn(),
    isLoadingNotificationWallet: ref(false),
    isLoadingNotificationTransaction: ref(false),
  }),
}));
vi.mock('InvestCommon/data/wallet/wallet.repository', () => ({
  useRepositoryWallet: () => ({
    getWalletState: getWalletStateRef,
    getTransactionsState: getTransactionsStateRef,
    walletId: walletIdRef,
    canLoadWalletData: ref(true),
    getWalletByProfile: vi.fn(),
    getTransactions: vi.fn(),
    resetAll: vi.fn(),
  }),
}));
vi.mock('InvestCommon/data/profiles/profiles.repository', () => ({
  useRepositoryProfiles: () => ({ getProfileByIdState: ref({ loading: false }) }),
}));
vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: () => ({
    selectedUserProfileData: ref({
      id: 1,
      isKycNone: false,
      isKycPending: false,
      isKycInProgress: false,
      isKycDeclined: false,
    }),
    selectedUserProfileId: ref(1),
  }),
}));
vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: () => ({ userLoggedIn: ref(true) }),
}));
vi.mock('InvestCommon/domain/dialogs/store/useDialogs', () => ({
  useDialogs: () => ({ openContactUsDialog: vi.fn() }),
}));
vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>();
  return {
    ...actual,
    useRoute: () => ({ query: {}, name: 'dashboard', path: '/dashboard' }),
    useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  };
});

import {
  useDashboardWallet,
  HOLDINGS_TAB,
  TRANSACTIONS_TAB,
  EVM_WALLET_TAB_INFO,
} from '../useDashboardWallet';

describe('useDashboardWallet', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    getEvmWalletStateRef.value = { data: { ...mockEvmData }, loading: false, error: null };
    getWalletStateRef.value = { data: { ...mockWalletData }, loading: false, error: null };
  });

  it('returns dialog state, tabs, balance cards, tables, and handlers', () => {
    const api = useDashboardWallet();
    expect(api.activeTab).toBeDefined();
    expect(api.isDialogTransactionOpen).toBeDefined();
    expect(api.transactionType).toBeDefined();
    expect(api.onTransactionClick).toBeDefined();
    expect(api.balanceCards).toBeDefined();
    expect(api.holdingsTable).toBeDefined();
    expect(api.transactionsTable).toBeDefined();
    expect(api.primaryButtons).toBeDefined();
    expect(api.moreButtons).toBeDefined();
    expect(api.handlePrimaryActionClick).toBeDefined();
    expect(api.handleWalletFilterApply).toBeDefined();
    expect(api.walletFilterItemsComputed).toBeDefined();
    expect(api.isAlertShow).toBeDefined();
    expect(api.showTable).toBeDefined();
    expect(api.totalBalanceMainFormatted).toBeDefined();
  });

  it('exports tab constants', () => {
    expect(HOLDINGS_TAB).toBe('holdings');
    expect(TRANSACTIONS_TAB).toBe('transactions');
    expect(EVM_WALLET_TAB_INFO.title).toBe('Crypto Wallet');
  });

  it('defaults activeTab to holdings', () => {
    const api = useDashboardWallet();
    expect(api.activeTab.value).toBe(HOLDINGS_TAB);
  });

  it('balanceCards has fiat, crypto, rwa entries', () => {
    const api = useDashboardWallet();
    expect(api.balanceCards.value).toHaveLength(3);
    expect(api.balanceCards.value.map((c: { id: string }) => c.id)).toEqual([
      'fiat',
      'crypto',
      'rwa',
    ]);
    expect(api.balanceCards.value[0].title).toBe('Fiat Balance:');
    expect(api.balanceCards.value[1].title).toBe('Tradable Crypto Balance:');
    expect(api.balanceCards.value[2].title).toBe('RWA Asset Balance:');
  });

  it('primaryButtons includes add-funds, withdraw, exchange', () => {
    const api = useDashboardWallet();
    const ids = api.primaryButtons.value.map((b: { id: string }) => b.id);
    expect(ids).toContain('add-funds');
    expect(ids).toContain('withdraw');
    expect(ids).toContain('exchange');
  });

  it('moreButtons includes earn and buy', () => {
    const api = useDashboardWallet();
    const ids = api.moreButtons.value.map((b: { id: string }) => b.id);
    expect(ids).toContain('earn');
    expect(ids).toContain('buy');
  });

  it('onTransactionClick opens dialog and sets transaction type', () => {
    const api = useDashboardWallet();
    expect(api.isDialogTransactionOpen.value).toBe(false);
    api.onTransactionClick('withdrawal' as any);
    expect(api.isDialogTransactionOpen.value).toBe(true);
    expect(api.transactionType.value).toBe('withdrawal');
  });
});
