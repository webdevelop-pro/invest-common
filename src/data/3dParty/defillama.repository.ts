import { acceptHMRUpdate, defineStore } from 'pinia';
import { createRepositoryStates, withActionState } from 'InvestCommon/data/repository/repository';
import { createFormatterCache } from 'InvestCommon/data/repository/formatterCache';
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

type DefiLlamaStates = {
  getYieldsState: DefiLlamaYieldPoolFormatted[];
  getPoolEnrichedState: DefiLlamaPoolEnriched;
  getPoolChartState: DefiLlamaChartDataPoint[];
  getProtocolConfigState: DefiLlamaConfigData;
  getPoolRiskState: DefiLlamaRiskData;
};

export const useRepositoryDefiLlama = defineStore('repository-defillama', () => {
  const yieldsCache = createFormatterCache<DefiLlamaYieldPool, DefiLlamaYieldPoolFormatted, string>({
    getKey: (pool) => pool.pool,
    getSignature: (pool) => [
      pool.apy,
      pool.apyBase,
      pool.apyReward,
      pool.apyMean30d,
      pool.tvlUsd,
      pool.symbol,
      pool.project,
    ].join('|'),
    format: (pool) => new DefiLlamaYieldsFormatter(pool).format(),
  });

  const {
    getYieldsState,
    getPoolEnrichedState,
    getPoolChartState,
    getProtocolConfigState,
    getPoolRiskState,
    resetAll: resetActionStates,
  } = createRepositoryStates<DefiLlamaStates>({
    getYieldsState: undefined,
    getPoolEnrichedState: undefined,
    getPoolChartState: undefined,
    getProtocolConfigState: undefined,
    getPoolRiskState: undefined,
  });
  const api = new ApiClient('https://yields.llama.fi');
  const apiConfig = new ApiClient('https://api.llama.fi');

  const getYields = async (protocol?: string) =>
    withActionState(getYieldsState, async () => {
      const { data } = await api.get<DefiLlamaResponse>('/pools', {
        headers: { accept: 'application/json' },
        credentials: 'omit',
        simple: true,
      });
      let pools = data.data || [];
      if (protocol) {
        const protocolLower = protocol.toLowerCase();
        pools = pools.filter((pool) => pool.project?.toLowerCase().includes(protocolLower));
      }
      pools.sort((a, b) => b.tvlUsd - a.tvlUsd);
      yieldsCache.prune(pools);
      const formattedPools = yieldsCache.formatMany(pools);
      return formattedPools;
    });

  const getPoolEnriched = async (poolId: string) =>
    withActionState(getPoolEnrichedState, async () => {
      const { data } = await api.get<DefiLlamaEnrichedResponse>('/poolsEnriched', {
        params: { pool: poolId },
        headers: { accept: 'application/json' },
        credentials: 'omit',
        simple: true,
      });
      return data.data;
    });

  const getPoolChart = async (poolId: string) =>
    withActionState(getPoolChartState, async () => {
      const { data } = await api.get<DefiLlamaChartResponse>(`/chart/${poolId}`, {
        headers: { accept: 'application/json' },
        credentials: 'omit',
      });
      return data.data || [];
    });

  const getProtocolConfig = async (protocol: string) =>
    withActionState(getProtocolConfigState, async () => {
      const { data } = await apiConfig.get<DefiLlamaConfigData>(`/config/smol/${protocol}`, {
        headers: { accept: 'application/json' },
        credentials: 'omit',
      });
      return data;
    });

  const getPoolRisk = async (params: {
    pool_old: string;
    chain: string;
    project: string;
    tvlUsd: number;
    underlyingTokens: string[];
  }) =>
    withActionState(getPoolRiskState, async () => {
      const queryParams = new URLSearchParams();
      queryParams.append('pool_old', params.pool_old);
      queryParams.append('chain', params.chain);
      queryParams.append('project', params.project);
      queryParams.append('tvlUsd', params.tvlUsd.toString());
      params.underlyingTokens.forEach((token) => {
        queryParams.append('underlyingTokens[]', token);
      });
      const { data } = await api.get<DefiLlamaRiskResponse>(`/risk?${queryParams.toString()}`, {
        headers: { accept: 'application/json' },
        credentials: 'omit',
      });
      return data.data;
    });

  const resetAll = () => {
    yieldsCache.clear();
    resetActionStates();
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

