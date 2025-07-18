import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref, nextTick } from 'vue';
import { useWalletTransactions } from '../useWalletTransactions';
import { WalletAddTransactionTypes } from 'InvestCommon/data/wallet/wallet.types';

vi.mock('InvestCommon/store/useProfileWallet/useProfileWallet', () => ({
  useProfileWalletStore: vi.fn(() => ({
    isCanWithdraw: ref(true),
    isCanLoadFunds: ref(true),
    currentBalance: ref(1000),
    pendingIncomingBalance: ref(500),
    pendingOutcomingBalance: ref(200),
    isGetWalletByProfileIdLoading: ref(false),
    walletId: ref(123),
  })),
}));

vi.mock('InvestCommon/data/wallet/wallet.repository', () => ({
  useRepositoryWallet: vi.fn(() => ({
    getTransactions: vi.fn().mockResolvedValue([]),
    getTransactionsState: ref({
      loading: false,
      error: null,
      data: [],
    }),
  })),
}));

describe('useWalletTransactions Store', () => {
  let store: ReturnType<typeof useWalletTransactions>;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    store = useWalletTransactions();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Dialog Actions', () => {
    it('should open withdraw dialog and set transaction type', () => {
      store.onWithdrawClick();
      
      expect(store.isDialogAddTransactionOpen).toBe(true);
      expect(store.addTransactiontTransactionType).toBe(WalletAddTransactionTypes.withdrawal);
    });

    it('should open add funds dialog and set transaction type', () => {
      store.onAddFundsClick();
      
      expect(store.isDialogAddTransactionOpen).toBe(true);
      expect(store.addTransactiontTransactionType).toBe(WalletAddTransactionTypes.deposit);
    });
  });

  describe('Computed Properties', () => {
    it('should show incoming balance when pendingIncomingBalance > 0', () => {
      const mockProfileWalletStore = {
        isCanWithdraw: ref(true),
        isCanLoadFunds: ref(true),
        currentBalance: ref(1000),
        pendingIncomingBalance: ref(500),
        pendingOutcomingBalance: ref(200),
        isGetWalletByProfileIdLoading: ref(false),
        walletId: ref(123),
      };
      
      vi.doMock('InvestCommon/store/useProfileWallet/useProfileWallet', () => ({
        useProfileWalletStore: vi.fn(() => mockProfileWalletStore),
      }));
      
      const newStore = useWalletTransactions();
      expect(newStore.isShowIncomingBalance).toBe(true);
    });

    it('should not show incoming balance when pendingIncomingBalance = 0', async () => {
      vi.resetModules();
      setActivePinia(createPinia());

      const mockProfileWalletStore = {
        isCanWithdraw: ref(true),
        isCanLoadFunds: ref(true),
        currentBalance: ref(1000),
        pendingIncomingBalance: ref(0),
        pendingOutcomingBalance: ref(200),
        isGetWalletByProfileIdLoading: ref(false),
        walletId: ref(123),
      };

      vi.doMock('InvestCommon/store/useProfileWallet/useProfileWallet', () => ({
        useProfileWalletStore: vi.fn(() => mockProfileWalletStore),
      }));

      vi.doMock('InvestCommon/data/wallet/wallet.repository', () => ({
        useRepositoryWallet: vi.fn(() => ({
          getTransactions: vi.fn().mockResolvedValue([]),
          getTransactionsState: ref({
            loading: false,
            error: null,
            data: [],
          }),
        })),
      }));

      const { useWalletTransactions } = await import('../useWalletTransactions');
      const newStore = useWalletTransactions();

      expect(newStore.isShowIncomingBalance).toBe(false);
    });

    it('should show outgoing balance when pendingOutcomingBalance > 0', () => {
      const mockProfileWalletStore = {
        isCanWithdraw: ref(true),
        isCanLoadFunds: ref(true),
        currentBalance: ref(1000),
        pendingIncomingBalance: ref(500),
        pendingOutcomingBalance: ref(200),
        isGetWalletByProfileIdLoading: ref(false),
        walletId: ref(123),
      };
      
      vi.doMock('InvestCommon/store/useProfileWallet/useProfileWallet', () => ({
        useProfileWalletStore: vi.fn(() => mockProfileWalletStore),
      }));
      
      const newStore = useWalletTransactions();
      expect(newStore.isShowOutgoingBalance).toBe(true);
    });

    it('should not show outgoing balance when pendingOutcomingBalance = 0', async () => {
      vi.resetModules();
      setActivePinia(createPinia());

      const mockProfileWalletStore = {
        isCanWithdraw: ref(true),
        isCanLoadFunds: ref(true),
        currentBalance: ref(1000),
        pendingIncomingBalance: ref(500),
        pendingOutcomingBalance: ref(0),
        isGetWalletByProfileIdLoading: ref(false),
        walletId: ref(123),
      };
      
      vi.doMock('InvestCommon/store/useProfileWallet/useProfileWallet', () => ({
        useProfileWalletStore: vi.fn(() => mockProfileWalletStore),
      }));
      vi.doMock('InvestCommon/data/wallet/wallet.repository', () => ({
        useRepositoryWallet: vi.fn(() => ({
          getTransactions: vi.fn().mockResolvedValue([]),
          getTransactionsState: ref({
            loading: false,
            error: null,
            data: [],
          }),
        })),
      }));
      
      const { useWalletTransactions } = await import('../useWalletTransactions');
      const newStore = useWalletTransactions();
      expect(newStore.isShowOutgoingBalance).toBe(false);
    });
  });

  describe('Watcher Behavior', () => {
    it('should call getTransactions when both profileId and walletId are valid', async () => {
      vi.resetModules();
      setActivePinia(createPinia());

      const mockGetTransactions = vi.fn().mockResolvedValue([]);
      const mockWalletRepository = {
        getTransactions: mockGetTransactions,
        getTransactionsState: ref({ loading: false, error: null, data: [] }),
      };

      const mockProfileWalletStore = {
        isCanWithdraw: ref(true),
        isCanLoadFunds: ref(true),
        currentBalance: ref(1000),
        pendingIncomingBalance: ref(500),
        pendingOutcomingBalance: ref(200),
        isGetWalletByProfileIdLoading: ref(false),
        walletId: ref(123),
      };

      vi.doMock('InvestCommon/store/useProfileWallet/useProfileWallet', () => ({
        useProfileWalletStore: vi.fn(() => mockProfileWalletStore),
      }));
      vi.doMock('InvestCommon/data/wallet/wallet.repository', () => ({
        useRepositoryWallet: vi.fn(() => mockWalletRepository),
      }));

      const { useWalletTransactions } = await import('../useWalletTransactions');
      const newStore = useWalletTransactions();

      newStore.setProfileContext(123, true);

      await nextTick();
      await nextTick();

      expect(mockGetTransactions).toHaveBeenCalledWith(123);
    });

    it('should not call getTransactions when profileId is 0', async () => {
      const mockGetTransactions = vi.fn().mockResolvedValue([]);
      const mockWalletRepository = {
        getTransactions: mockGetTransactions,
        getTransactionsState: ref({ loading: false, error: null, data: [] }),
      };
      
      vi.doMock('InvestCommon/data/wallet/wallet.repository', () => ({
        useRepositoryWallet: vi.fn(() => mockWalletRepository),
      }));
      
      const newStore = useWalletTransactions();
      
      newStore.setProfileContext(0, true);
      
      await nextTick();
      
      expect(mockGetTransactions).not.toHaveBeenCalled();
    });

    it('should not call getTransactions when walletId is 0', async () => {
      const mockGetTransactions = vi.fn().mockResolvedValue([]);
      const mockWalletRepository = {
        getTransactions: mockGetTransactions,
        getTransactionsState: ref({ loading: false, error: null, data: [] }),
      };
      
      const mockProfileWalletStore = {
        walletId: ref(0),
        isCanWithdraw: ref(true),
        isCanLoadFunds: ref(true),
        currentBalance: ref(1000),
        pendingIncomingBalance: ref(500),
        pendingOutcomingBalance: ref(200),
        isGetWalletByProfileIdLoading: ref(false),
      };
      
      vi.doMock('InvestCommon/store/useProfileWallet/useProfileWallet', () => ({
        useProfileWalletStore: vi.fn(() => mockProfileWalletStore),
      }));
      vi.doMock('InvestCommon/data/wallet/wallet.repository', () => ({
        useRepositoryWallet: vi.fn(() => mockWalletRepository),
      }));
      
      const newStore = useWalletTransactions();
      
      newStore.setProfileContext(123, true);
      
      await nextTick();
      
      expect(mockGetTransactions).not.toHaveBeenCalled();
    });
  });
}); 