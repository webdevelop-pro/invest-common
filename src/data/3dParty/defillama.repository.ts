import { acceptHMRUpdate, defineStore } from 'pinia';
import { createActionState } from 'InvestCommon/data/repository/repository';
import { ApiClient } from 'InvestCommon/data/service/apiClient';
import { DefiLlamaYieldsFormatter, type DefiLlamaYieldPoolFormatted } from './formatter/yields.formatter';

export interface DefiLlamaYieldPool {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number | null;
  apyBase: number | null;
  apyReward: number | null;
  apyMean30d: number | null;
  ilRisk: string;
  apyPct1D: number | null;
  apyPct7D: number | null;
  apyPct30D: number | null;
  stablecoin: boolean;
  poolMeta: string | null;
  mu: number;
  sigma: number;
  count: number;
  outlier: boolean;
  underlyingTokens: string[] | null;
  il7d: number | null;
  il30d: number | null;
  apyBase7d: number | null;
  apyMean7d: number | null;
  apyBaseInception: number | null;
  apyInception: number | null;
}

interface DefiLlamaResponse {
  data: DefiLlamaYieldPool[];
}

export interface DefiLlamaPoolEnriched extends DefiLlamaYieldPool {
  // Additional enriched fields that may be available
  [key: string]: unknown;
}

interface DefiLlamaEnrichedResponse {
  data: DefiLlamaPoolEnriched;
}

export interface DefiLlamaChartDataPoint {
  timestamp: string;
  tvlUsd: number;
  apy: number | null;
  apyBase: number | null;
  apyReward: number | null;
  il7d: number | null;
  apyBase7d: number | null;
}

interface DefiLlamaChartResponse {
  status: string;
  data: DefiLlamaChartDataPoint[];
}

export interface DefiLlamaConfigData {
  [key: string]: unknown;
}

export interface DefiLlamaRiskData {
  [key: string]: unknown;
}

interface DefiLlamaRiskResponse {
  status: string;
  data: DefiLlamaRiskData;
}

export const useRepositoryDefiLlama = defineStore('repository-defillama', () => {
  const getYieldsState = createActionState<DefiLlamaYieldPoolFormatted[]>();
  const getPoolEnrichedState = createActionState<DefiLlamaPoolEnriched>();
  const getPoolChartState = createActionState<DefiLlamaChartDataPoint[]>();
  const getProtocolConfigState = createActionState<DefiLlamaConfigData>();
  const getPoolRiskState = createActionState<DefiLlamaRiskData>();
  const api = new ApiClient('https://yields.llama.fi');
  const apiConfig = new ApiClient('https://api.llama.fi');

  const getYields = async (protocol?: string) => {
    try {
      getYieldsState.value.loading = true;
      getYieldsState.value.error = null;
      
      // DefiLlama uses /pools endpoint and filters client-side
      const { data } = await api.get<DefiLlamaResponse>('/pools', {
        headers: {
          accept: 'application/json',
        },
        credentials: 'omit',
      });

      let pools = data.data || [];
      
      // Filter by protocol if provided (matches DefiLlama's approach)
      // They filter for projects that include the protocol name (case-insensitive)
      if (protocol) {
        const protocolLower = protocol.toLowerCase();
        pools = pools.filter(
          (pool) => pool.project?.toLowerCase().includes(protocolLower)
        );
      }
      
      // Sort by TVL descending (same as DefiLlama)
      pools.sort((a, b) => b.tvlUsd - a.tvlUsd);
      
      // Format pools using formatter
      const formattedPools = pools.map((pool) => 
        new DefiLlamaYieldsFormatter(pool).format()
      );
      
      getYieldsState.value.data = formattedPools;
      return formattedPools;
    } catch (err) {
      getYieldsState.value.error = err as Error;
      getYieldsState.value.data = undefined;
      throw err;
    } finally {
      getYieldsState.value.loading = false;
    }
  };

  const getPoolEnriched = async (poolId: string) => {
    try {
      getPoolEnrichedState.value.loading = true;
      getPoolEnrichedState.value.error = null;
      
      const { data } = await api.get<DefiLlamaEnrichedResponse>('/poolsEnriched', {
        params: {
          pool: poolId,
        },
        headers: {
          accept: 'application/json',
        },
        credentials: 'omit',
      });

      getPoolEnrichedState.value.data = data.data;
      return data.data;
    } catch (err) {
      getPoolEnrichedState.value.error = err as Error;
      getPoolEnrichedState.value.data = undefined;
      throw err;
    } finally {
      getPoolEnrichedState.value.loading = false;
    }
  };

  const getPoolChart = async (poolId: string) => {
    try {
      getPoolChartState.value.loading = true;
      getPoolChartState.value.error = null;
      
      const { data } = await api.get<DefiLlamaChartResponse>(`/chart/${poolId}`, {
        headers: {
          accept: 'application/json',
        },
        credentials: 'omit',
      });

      getPoolChartState.value.data = data.data || [];
      return data.data || [];
    } catch (err) {
      getPoolChartState.value.error = err as Error;
      getPoolChartState.value.data = undefined;
      throw err;
    } finally {
      getPoolChartState.value.loading = false;
    }
  };

  const getProtocolConfig = async (protocol: string) => {
    try {
      getProtocolConfigState.value.loading = true;
      getProtocolConfigState.value.error = null;
      
      const { data } = await apiConfig.get<DefiLlamaConfigData>(`/config/smol/${protocol}`, {
        headers: {
          accept: 'application/json',
        },
        credentials: 'omit',
      });

      getProtocolConfigState.value.data = data;
      return data;
    } catch (err) {
      getProtocolConfigState.value.error = err as Error;
      getProtocolConfigState.value.data = undefined;
      throw err;
    } finally {
      getProtocolConfigState.value.loading = false;
    }
  };

  const getPoolRisk = async (params: {
    pool_old: string;
    chain: string;
    project: string;
    tvlUsd: number;
    underlyingTokens: string[];
  }) => {
    try {
      getPoolRiskState.value.loading = true;
      getPoolRiskState.value.error = null;
      
      const queryParams = new URLSearchParams();
      queryParams.append('pool_old', params.pool_old);
      queryParams.append('chain', params.chain);
      queryParams.append('project', params.project);
      queryParams.append('tvlUsd', params.tvlUsd.toString());
      params.underlyingTokens.forEach((token) => {
        queryParams.append('underlyingTokens[]', token);
      });

      const { data } = await api.get<DefiLlamaRiskResponse>(`/risk?${queryParams.toString()}`, {
        headers: {
          accept: 'application/json',
        },
        credentials: 'omit',
      });

      getPoolRiskState.value.data = data.data;
      return data.data;
    } catch (err) {
      getPoolRiskState.value.error = err as Error;
      getPoolRiskState.value.data = undefined;
      throw err;
    } finally {
      getPoolRiskState.value.loading = false;
    }
  };

  const resetAll = () => {
    getYieldsState.value = { loading: false, error: null, data: undefined };
    getPoolEnrichedState.value = { loading: false, error: null, data: undefined };
    getPoolChartState.value = { loading: false, error: null, data: undefined };
    getProtocolConfigState.value = { loading: false, error: null, data: undefined };
    getPoolRiskState.value = { loading: false, error: null, data: undefined };
  };

  return {
    getYieldsState,
    getPoolEnrichedState,
    getPoolChartState,
    getProtocolConfigState,
    getPoolRiskState,
    getYields,
    getPoolEnriched,
    getPoolChart,
    getProtocolConfig,
    getPoolRisk,
    resetAll,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRepositoryDefiLlama, import.meta.hot));
}

