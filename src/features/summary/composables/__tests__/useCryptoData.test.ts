import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { shallowMount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import { ref } from 'vue';

// Mock crypto data
const mockCryptoData = {
  bitcoin: { usd: 50000, usd_24h_change: 1.2 },
  ethereum: { usd: 3000, usd_24h_change: -0.5 },
  cardano: { usd: 0.4, usd_24h_change: 0.1 },
  solana: { usd: 150, usd_24h_change: 2.3 },
  ripple: { usd: 0.6, usd_24h_change: -1.1 },
  dogecoin: { usd: 0.08, usd_24h_change: 0.9 },
  litecoin: { usd: 80, usd_24h_change: 0.0 },
  polkadot: { usd: 5, usd_24h_change: 0.2 },
  tron: { usd: 0.1, usd_24h_change: -0.2 },
  'avalanche-2': { usd: 30, usd_24h_change: 0.7 },
  chainlink: { usd: 12, usd_24h_change: -0.3 },
};

// Mock the crypto repository
const mockGetPricesState = ref({ loading: false, error: null, data: mockCryptoData });

vi.mock('InvestCommon/data/3dParty/crypto.repository', () => ({
  useRepositoryCryptoo: () => ({
    getPricesState: mockGetPricesState,
    getSimplePrices: vi.fn().mockResolvedValue(mockCryptoData),
  }),
}));

import DashboardSummary from '../../DashboardSummary.vue';

describe('useCryptoData', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockGetPricesState.value = { loading: false, error: null, data: mockCryptoData };
  });

  it('loads crypto prices and maps items in DashboardSummary', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    
    const router = createRouter({ 
      history: createWebHistory(), 
      routes: [{ path: '/', component: { template: '<div />' } }] 
    });
    
    const wrapper = shallowMount(DashboardSummary, {
      global: { 
        plugins: [pinia, router],
      },
    });
    
    await wrapper.vm.$nextTick();
    
    const cryptoTicker = wrapper.findComponent({ name: 'CryptoPricesTicker' });
    expect(cryptoTicker.exists()).toBe(true);
    
    const items = cryptoTicker.props('items') as any[];
    expect(items.length).toBe(11);
    
    const btc = items.find((c: any) => c.id === 'bitcoin');
    expect(btc?.name).toBe('Bitcoin');
    expect(btc?.priceUsd).toBe(50000);
    expect(btc?.change24h).toBe(1.2);
  });
});