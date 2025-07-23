import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref, nextTick } from 'vue';
import { WalletAddTransactionTypes } from 'InvestCommon/data/wallet/wallet.types';
import { useWalletTransactions } from '../useWalletTransactions';

describe('useWalletTransactions Store', () => {
  let store: ReturnType<typeof useWalletTransactions>;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Dialog Actions', () => {
    beforeEach(() => {
      vi.doMock('InvestCommon/data/wallet/wallet.repository', () => ({
        useRepositoryWallet: vi.fn(() => ({
          getTransactions: vi.fn().mockResolvedValue([]),
          getTransactionsState: ref({
            loading: false,
            error: null,
            data: [],
          }),
          getWalletState: ref({
            loading: false,
            error: null,
            data: {},
          }),
          walletId: ref(123),
        })),
      }));
      store = useWalletTransactions();
    });

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
    it('should show incoming balance when pendingIncomingBalance > 0', async () => {
      vi.resetModules();
      setActivePinia(createPinia());
      vi.doMock('InvestCommon/data/wallet/wallet.repository', () => ({
        useRepositoryWallet: vi.fn(() => ({
          getTransactions: vi.fn().mockResolvedValue([]),
          getTransactionsState: ref({
            loading: false,
            error: null,
            data: [],
          }),
          getWalletState: ref({
            loading: false,
            error: null,
            data: {
              pendingIncomingBalance: 500,
            },
          }),
          walletId: ref(123),
        })),
      }));
      const { useWalletTransactions } = await import('../useWalletTransactions');
      const newStore = useWalletTransactions();
      expect(newStore.isShowIncomingBalance).toBe(true);
    });

    it('should not show incoming balance when pendingIncomingBalance = 0', async () => {
      vi.resetModules();
      setActivePinia(createPinia());
      vi.doMock('InvestCommon/data/wallet/wallet.repository', () => ({
        useRepositoryWallet: vi.fn(() => ({
          getTransactions: vi.fn().mockResolvedValue([]),
          getTransactionsState: ref({
            loading: false,
            error: null,
            data: [],
          }),
          getWalletState: ref({
            loading: false,
            error: null,
            data: {
              pendingIncomingBalance: 0,
            },
          }),
          walletId: ref(123),
        })),
      }));
      const { useWalletTransactions } = await import('../useWalletTransactions');
      const newStore = useWalletTransactions();
      expect(newStore.isShowIncomingBalance).toBe(false);
    });

    it('should show outgoing balance when pendingOutcomingBalance > 0', async () => {
      vi.resetModules();
      setActivePinia(createPinia());
      vi.doMock('InvestCommon/data/wallet/wallet.repository', () => ({
        useRepositoryWallet: vi.fn(() => ({
          getTransactions: vi.fn().mockResolvedValue([]),
          getTransactionsState: ref({
            loading: false,
            error: null,
            data: [],
          }),
          getWalletState: ref({
            loading: false,
            error: null,
            data: {
              pendingOutcomingBalance: 200,
            },
          }),
          walletId: ref(123),
        })),
      }));
      const { useWalletTransactions } = await import('../useWalletTransactions');
      const newStore = useWalletTransactions();
      expect(newStore.isShowOutgoingBalance).toBe(true);
    });

    it('should not show outgoing balance when pendingOutcomingBalance = 0', async () => {
      vi.resetModules();
      setActivePinia(createPinia());
      vi.doMock('InvestCommon/data/wallet/wallet.repository', () => ({
        useRepositoryWallet: vi.fn(() => ({
          getTransactions: vi.fn().mockResolvedValue([]),
          getTransactionsState: ref({
            loading: false,
            error: null,
            data: [],
          }),
          getWalletState: ref({
            loading: false,
            error: null,
            data: {
              pendingOutcomingBalance: 0,
            },
          }),
          walletId: ref(123),
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
      vi.doMock('InvestCommon/data/wallet/wallet.repository', () => ({
        useRepositoryWallet: vi.fn(() => ({
          getTransactions: mockGetTransactions,
          getTransactionsState: ref({ loading: false, error: null, data: [] }),
          getWalletState: ref({ loading: false, error: null, data: {} }),
          walletId: ref(123),
        })),
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
      vi.doMock('InvestCommon/data/wallet/wallet.repository', () => ({
        useRepositoryWallet: vi.fn(() => ({
          getTransactions: mockGetTransactions,
          getTransactionsState: ref({ loading: false, error: null, data: [] }),
          getWalletState: ref({ loading: false, error: null, data: {} }),
          walletId: ref(123),
        })),
      }));
      const { useWalletTransactions } = await import('../useWalletTransactions');
      const newStore = useWalletTransactions();
      newStore.setProfileContext(0, true);
      await nextTick();
      expect(mockGetTransactions).not.toHaveBeenCalled();
    });

    it('should not call getTransactions when walletId is 0', async () => {
      const mockGetTransactions = vi.fn().mockResolvedValue([]);
      vi.doMock('InvestCommon/data/wallet/wallet.repository', () => ({
        useRepositoryWallet: vi.fn(() => ({
          getTransactions: mockGetTransactions,
          getTransactionsState: ref({ loading: false, error: null, data: [] }),
          getWalletState: ref({ loading: false, error: null, data: {} }),
          walletId: ref(0),
        })),
      }));
      const { useWalletTransactions } = await import('../useWalletTransactions');
      const newStore = useWalletTransactions();
      newStore.setProfileContext(123, true);
      await nextTick();
      expect(mockGetTransactions).not.toHaveBeenCalled();
    });
  });
});
