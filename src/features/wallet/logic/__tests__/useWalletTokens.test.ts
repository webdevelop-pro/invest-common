import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';

const realBalances = [
  { id: 1, address: '0xusdc', symbol: 'USDC', amount: 1000, name: 'USD Coin' },
  { id: 2, address: '0xeth', symbol: 'ETH', amount: 0.5, name: 'Ether' },
  { id: 3, address: '0xdai', symbol: 'DAI', amount: 500, name: 'Dai' },
];

const getEvmWalletStateRef = ref({
  data: { balances: realBalances },
  loading: false,
  error: null as Error | null,
});
const isLoadingNotificationWalletRef = ref(false);

vi.mock('InvestCommon/data/evm/evm.repository', () => ({
  useRepositoryEvm: () => ({
    getEvmWalletState: getEvmWalletStateRef,
    isLoadingNotificationWallet: isLoadingNotificationWalletRef,
  }),
}));

import { useWalletTokens } from '../useWalletTokens';

describe('useWalletTokens', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    getEvmWalletStateRef.value = {
      data: { balances: [...realBalances] },
      loading: false,
      error: null,
    };
    isLoadingNotificationWalletRef.value = false;
  });

  it('returns table, filterItems, handleFilterApply, tokensOptions', () => {
    const api = useWalletTokens();
    expect(api.table).toBeDefined();
    expect(api.filterItems).toBeDefined();
    expect(api.handleFilterApply).toBeDefined();
    expect(api.tokensOptions).toBeDefined();
    expect(api.filteredTokensOptions).toBeDefined();
    expect(api.isLoading).toBeDefined();
  });

  it('tokensOptions equals evm balances', () => {
    const api = useWalletTokens();
    expect(api.tokensOptions.value).toHaveLength(3);
    expect(api.tokensOptions.value[0].symbol).toBe('USDC');
    expect(api.tokensOptions.value[1].symbol).toBe('ETH');
  });

  it('table has title Tokens and header/config', () => {
    const api = useWalletTokens();
    expect(api.table.value).toHaveLength(1);
    expect(api.table.value[0].title).toBe('Tokens:');
    expect(api.table.value[0].data).toHaveLength(3);
    expect(api.table.value[0].header).toBeDefined();
  });

  it('filterItems has holding type options RWA and Stable Coin', () => {
    const api = useWalletTokens();
    expect(api.filterItems.value).toHaveLength(1);
    expect(api.filterItems.value[0].value).toBe('holdingType');
    expect(api.filterItems.value[0].options).toContain('RWA');
    expect(api.filterItems.value[0].options).toContain('Stable Coin');
  });

  it('handleFilterApply updates filter and visible tokens', () => {
    const api = useWalletTokens();
    api.handleFilterApply([{ value: 'holdingType', model: ['Stable Coin'] }]);
    expect(api.filteredTokensOptions.value).toHaveLength(2); // USDC, DAI
    expect(api.filteredTokensOptions.value.map((t: { symbol: string }) => t.symbol)).toEqual(
      expect.arrayContaining(['USDC', 'DAI']),
    );
  });

  it('isLoading reflects evm loading state', () => {
    getEvmWalletStateRef.value.loading = true;
    const api = useWalletTokens();
    expect(api.isLoading.value).toBe(true);
  });
});
