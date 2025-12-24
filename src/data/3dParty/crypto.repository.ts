import { acceptHMRUpdate, defineStore } from 'pinia';
import { createActionState } from 'InvestCommon/data/repository/repository';
import { ApiClient } from 'InvestCommon/data/service/apiClient';

export type CryptooId = 'bitcoin' | 'ethereum' | 'cardano' | 'solana' | 'ripple' | 'dogecoin' | 'litecoin' | 'polkadot' | 'tron' | 'avalanche-2' | 'chainlink';

export interface CryptooSimplePriceItem {
  usd: number;
  usd_24h_change: number;
}

export type CryptooSimplePriceResponse = Record<CryptooId, CryptooSimplePriceItem>;

export const useRepositoryCryptoo = defineStore('repository-cryptoo', () => {
  const getPricesState = createActionState<CryptooSimplePriceResponse>();
  const api = new ApiClient('https://api.coingecko.com');

  const getSimplePrices = async (ids: CryptooId[]) => {
    try {
      getPricesState.value.loading = true;
      getPricesState.value.error = null;
      const uniqueIds = Array.from(new Set(ids));
      const { data } = await api.get<CryptooSimplePriceResponse>('/api/v3/simple/price', {
        params: {
          ids: uniqueIds.join(','),
          vs_currencies: 'usd',
          include_24hr_change: 'true',
        },
        headers: {
          accept: 'application/json',
        },
        credentials: 'omit',
      });
      getPricesState.value.data = data;
      return data;
    } catch (err) {
      getPricesState.value.error = err as Error;
      getPricesState.value.data = undefined;
      throw err;
    } finally {
      getPricesState.value.loading = false;
    }
  };

  const resetAll = () => {
    getPricesState.value = { loading: false, error: null, data: undefined };
  };

  return {
    getPricesState,
    getSimplePrices,
    resetAll,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRepositoryCryptoo, import.meta.hot));
}


