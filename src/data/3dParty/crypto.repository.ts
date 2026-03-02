import { acceptHMRUpdate, defineStore } from 'pinia';
import { createRepositoryStates, withActionState } from 'InvestCommon/data/repository/repository';
import { ApiClient } from 'InvestCommon/data/service/apiClient';

export type CryptoId = 'bitcoin' | 'ethereum' | 'cardano' | 'solana' | 'ripple' | 'dogecoin' | 'litecoin' | 'polkadot' | 'tron' | 'avalanche-2' | 'chainlink';

export interface CryptoSimplePriceItem {
  usd: number;
  usd_24h_change: number;
}

export type CryptoSimplePriceResponse = Record<CryptoId, CryptoSimplePriceItem>;

type CryptoStates = {
  getPricesState: CryptoSimplePriceResponse;
};

export const useRepositoryCrypto = defineStore('repository-crypto', () => {
  const api = new ApiClient('https://api.coingecko.com');

  const { getPricesState, resetAll } = createRepositoryStates<CryptoStates>({
    getPricesState: undefined,
  });

  const getSimplePrices = async (ids: CryptoId[]) =>
    withActionState(getPricesState, async () => {
      const uniqueIds = Array.from(new Set(ids));
      const { data } = await api.get<CryptoSimplePriceResponse>('/api/v3/simple/price', {
        params: {
          ids: uniqueIds.join(','),
          vs_currencies: 'usd',
          include_24hr_change: 'true',
        },
        headers: { accept: 'application/json' },
        credentials: 'omit',
      });
      return data;
    });

  return {
    getPricesState,
    getSimplePrices,
    resetAll,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRepositoryCrypto, import.meta.hot));
}


