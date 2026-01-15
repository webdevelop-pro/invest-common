import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useRepositoryDefiLlama, type DefiLlamaPoolEnriched, type DefiLlamaChartDataPoint, type DefiLlamaConfigData, type DefiLlamaRiskData } from 'InvestCommon/data/3dParty/defillama.repository';
import { ROUTE_DASHBOARD_EARN } from 'InvestCommon/domain/config/enums/routes';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import type { DefiLlamaYieldPoolFormatted } from 'InvestCommon/data/3dParty/formatter/yields.formatter';
import { EarnDetailFormatter } from 'InvestCommon/data/3dParty/formatter/earnDetail.formatter';
import { RiskFormatter, type RiskSection } from 'InvestCommon/data/3dParty/formatter/risk.formatter';

export function useEarnDetail() {
  const route = useRoute();
  const router = useRouter();
  const defiLlamaRepo = useRepositoryDefiLlama();
  const {
    getYieldsState, getPoolEnrichedState, getPoolChartState, getProtocolConfigState, getPoolRiskState,
  } = storeToRefs(defiLlamaRepo);
  const profilesStore = useProfilesStore();
  const { selectedUserProfileId } = storeToRefs(profilesStore);

  const poolId = computed(() => route.params.poolId as string);

  const poolData = computed<DefiLlamaYieldPoolFormatted | undefined>(() => {
    const pools = getYieldsState.value.data || [];
    return pools.find((pool: DefiLlamaYieldPoolFormatted) => pool.pool === poolId.value);
  });

  const loading = computed(() => getYieldsState.value.loading
   || getPoolEnrichedState.value.loading || getPoolChartState.value.loading || getProtocolConfigState.value.loading);
  const error = computed(() => getYieldsState.value.error
   || getPoolEnrichedState.value.error || getPoolChartState.value.error || getProtocolConfigState.value.error);
  const poolEnrichedData = computed<DefiLlamaPoolEnriched | undefined>(() => getPoolEnrichedState.value.data);
  const poolChartData = computed<DefiLlamaChartDataPoint[]>(() => getPoolChartState.value.data || []);
  const protocolConfigData = computed<DefiLlamaConfigData | undefined>(() => getProtocolConfigState.value.data);
  const poolRiskData = computed<DefiLlamaRiskData | undefined>(() => getPoolRiskState.value.data);
  const riskLoading = computed(() => getPoolRiskState.value.loading);

  // Individual loading states
  const chartsLoading = computed(() => getPoolChartState.value.loading);
  const poolInfoLoading = computed(() => getYieldsState.value.loading || getPoolEnrichedState.value.loading);
  const protocolConfigLoading = computed(() => getProtocolConfigState.value.loading);

  const formatter = new EarnDetailFormatter();
  const riskFormatter = new RiskFormatter();

  const infoData = computed(() => {
    return formatter.formatInfoData(poolData.value, poolEnrichedData.value);
  });

  const topInfoData = computed(() => {
    return formatter.formatTopInfoData(poolData.value, poolEnrichedData.value);
  });

  const formattedRiskData = computed<RiskSection[]>(() => {
    return riskFormatter.formatRiskData(poolRiskData.value);
  });

  const ratingColorToCssColor = (ratingColor: string | undefined): string => {
    return riskFormatter.ratingColorToCssColor(ratingColor);
  };

  const overviewSections = computed(() => {
    const sections: Array<{ title: string; data: any[]; options?: any; loading?: boolean }> = [];
    
    // Add chart sections (show even if loading)
    const charts = formatter.formatChartData(poolChartData.value);
    if (chartsLoading.value || charts.length > 0) {
      charts.forEach((chart) => {
        sections.push({
          title: chart.title,
          data: chart.data,
          options: chart.options,
          loading: chartsLoading.value && chart.data.length === 0,
        });
      });
      // If loading and no charts yet, show placeholder
      if (chartsLoading.value && charts.length === 0) {
        sections.push({
          title: 'APY History',
          data: [],
          options: undefined,
          loading: true,
        });
        sections.push({
          title: 'TVL History',
          data: [],
          options: undefined,
          loading: true,
        });
      }
    }
    
    // Add info data section (show even if loading)
    if (poolInfoLoading.value || infoData.value.length > 0) {
      sections.push({
        title: 'Pool Information',
        data: infoData.value,
        loading: poolInfoLoading.value && infoData.value.length === 0,
      });
    }
    
    // Add protocol config section (show even if loading)
    const protocolConfigInfo = formatter.formatProtocolConfigData(protocolConfigData.value);
    if (protocolConfigLoading.value || protocolConfigInfo.length > 0) {
      sections.push({
        title: 'Protocol Configuration',
        data: protocolConfigInfo,
        loading: protocolConfigLoading.value && protocolConfigInfo.length === 0,
      });
    }
    
    return sections;
  });

  const onBackClick = () => {
    void router.push({
      name: ROUTE_DASHBOARD_EARN,
      params: { profileId: selectedUserProfileId.value },
    });
  };

  onMounted(async () => {
    // If pools are not loaded, fetch them
    if (!getYieldsState.value.data) {
      await defiLlamaRepo.getYields('aave');
    }

    // If pool not found, redirect to earn list
    if (!poolData.value) {
      void router.push({
        name: ROUTE_DASHBOARD_EARN,
        params: { profileId: selectedUserProfileId.value },
      });
      return;
    }

    // Fetch all data in parallel to show as we get it
    if (poolId.value) {
      // Fetch enriched pool data
      defiLlamaRepo.getPoolEnriched(poolId.value).catch((err: Error) => {
        console.warn('Failed to fetch enriched pool data:', err);
      });

      // Fetch chart data
      defiLlamaRepo.getPoolChart(poolId.value).catch((err: Error) => {
        console.warn('Failed to fetch chart data:', err);
      });

      // Fetch protocol config if pool data is available
      if (poolData.value?.project) {
        const protocol = poolData.value.project.toLowerCase().replace(/\s+/g, '-');
        defiLlamaRepo.getProtocolConfig(protocol).catch((err: Error) => {
          console.warn('Failed to fetch protocol config:', err);
        });
      }

      // Fetch risk data if pool data is available
      if (poolData.value) {
        const riskParams = {
          pool_old: poolData.value.pool,
          chain: poolData.value.chain || 'ethereum',
          project: poolData.value.project,
          tvlUsd: poolData.value.tvlUsd || 0,
          underlyingTokens: poolData.value.underlyingTokens || [],
        };
        defiLlamaRepo.getPoolRisk(riskParams).catch((err: Error) => {
          console.warn('Failed to fetch risk data:', err);
        });
      }
    }
  });

  return {
    poolData,
    overviewSections,
    infoData,
    topInfoData,
    poolRiskData,
    riskLoading,
    formattedRiskData,
    ratingColorToCssColor,
    loading,
    error,
    onBackClick,
  };
}

