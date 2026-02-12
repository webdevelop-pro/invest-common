import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';
import { EvmTransactionTypes } from 'InvestCommon/data/evm/evm.types';
import { WalletAddTransactionTypes } from 'InvestCommon/data/wallet/wallet.types';

const evmTransactions = [
  {
    id: 1,
    type: EvmTransactionTypes.deposit,
    created_at: '2025-02-05T12:00:00Z',
    amount: 100,
    source_wallet_id: undefined,
  },
  {
    id: 2,
    type: EvmTransactionTypes.withdrawal,
    created_at: '2025-02-04T10:00:00Z',
    amount: 50,
    source_wallet_id: undefined,
  },
];
const fiatTransactions = [
  {
    id: 10,
    type: WalletAddTransactionTypes.investment,
    created_at: '2025-02-03T08:00:00Z',
    amount: 500,
    source_wallet_id: 1,
  },
];

const walletIdRef = ref(1);
const getWalletStateRef = ref({
  data: { id: 1, status: 'verified' },
  loading: false,
  error: null as Error | null,
});
const getTransactionsStateRef = ref({
  data: fiatTransactions,
  loading: false,
  error: null as Error | null,
});
const getEvmWalletStateRef = ref({
  data: { formattedTransactions: evmTransactions },
  loading: false,
  error: null as Error | null,
});
const getTransactions = vi.fn().mockResolvedValue(undefined);

vi.mock('InvestCommon/data/wallet/wallet.repository', () => ({
  useRepositoryWallet: () => ({
    getWalletState: getWalletStateRef,
    getTransactionsState: getTransactionsStateRef,
    walletId: walletIdRef,
    getTransactions: getTransactions,
  }),
}));
vi.mock('InvestCommon/data/evm/evm.repository', () => ({
  useRepositoryEvm: () => ({
    getEvmWalletState: getEvmWalletStateRef,
    isLoadingNotificationWallet: ref(false),
    isLoadingNotificationTransaction: ref(false),
  }),
}));

import { useWalletTransactions } from '../useWalletTransactions';

describe('useWalletTransactions', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    getWalletStateRef.value = { data: { id: 1 }, loading: false, error: null };
    getTransactionsStateRef.value = { data: [...fiatTransactions], loading: false, error: null };
    getEvmWalletStateRef.value = {
      data: { formattedTransactions: [...evmTransactions] },
      loading: false,
      error: null,
    };
    getTransactions.mockClear();
  });

  it('returns table, filterItems, handleFilterApply, transactionsOptions', () => {
    const api = useWalletTransactions();
    expect(api.table).toBeDefined();
    expect(api.filterItems).toBeDefined();
    expect(api.handleFilterApply).toBeDefined();
    expect(api.transactionsOptions).toBeDefined();
    expect(api.filteredTransactions).toBeDefined();
    expect(api.isLoading).toBeDefined();
    expect(api.setFilters).toBeDefined();
  });

  it('combines evm and fiat transactions sorted by date desc', () => {
    const api = useWalletTransactions();
    expect(api.transactionsOptions.value.length).toBe(3);
    expect(api.transactionsOptions.value[0].created_at).toBe('2025-02-05T12:00:00Z');
    expect(api.transactionsOptions.value[1].created_at).toBe('2025-02-04T10:00:00Z');
    expect(api.transactionsOptions.value[2].created_at).toBe('2025-02-03T08:00:00Z');
  });

  it('table has Latest Transactions title and data', () => {
    const api = useWalletTransactions();
    expect(api.table.value[0].title).toBe('Latest Transactions:');
    expect(api.table.value[0].data.length).toBeLessThanOrEqual(10);
  });

  it('filterItems has balance type and transaction type', () => {
    const api = useWalletTransactions();
    expect(api.filterItems.value.some((f) => f.value === 'balanceType')).toBe(true);
    expect(api.filterItems.value.some((f) => f.value === 'transactionType')).toBe(true);
  });

  it('handleFilterApply updates filters', () => {
    const api = useWalletTransactions();
    api.handleFilterApply([
      { value: 'balanceType', model: ['Crypto'] },
      { value: 'transactionType', model: ['Deposit'] },
    ]);
    expect(api.filters.value.balanceTypes).toEqual(['Crypto']);
    expect(api.filters.value.transactionTypes).toEqual(['Deposit']);
  });

  it('setFilters replaces filter state', () => {
    const api = useWalletTransactions();
    api.setFilters({
      balanceTypes: ['Fiat'],
      transactionTypes: ['Investment'],
    });
    expect(api.filters.value.balanceTypes).toEqual(['Fiat']);
    expect(api.filters.value.transactionTypes).toEqual(['Investment']);
  });
});
